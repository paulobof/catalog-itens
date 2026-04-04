# Performance Review — Catalog Itens Design Spec

**Date:** 2026-04-04  
**Reviewer:** Performance Engineering  
**Source spec:** `2026-04-04-catalog-itens-design.md`

---

## Executive Summary

The spec describes a solid personal-use application with sensible defaults. Seven concrete performance risks were identified that, left unaddressed at implementation time, will produce slow page loads, N+1 query storms on product listing, and degraded MinIO throughput on photo operations. All findings below include drop-in fixes that fit the stated KISS and SOLID principles.

---

## 1. N+1 Queries and Eager/Lazy Loading Strategy

### Risk: Product list endpoint

The product list (`GET /api/products`) must return thumbnails, tags, and location names in a single page. With Hibernate default lazy loading, loading a page of 20 products will generate:

- 1 query for products
- 20 queries for tags (one per product)
- 20 queries for photos (one per product — thumbnail only needed)
- 20 queries for ProductLocation (one per product — for location name display)

Total: **61 queries per page load**.

### Fix: JPQL JOIN FETCH with projection

Use a single JPQL query with explicit `JOIN FETCH` for the list view. Do not fetch the full graph — project only what the card needs.

```java
// ProductRepository
@Query("""
    SELECT DISTINCT p FROM Product p
    LEFT JOIN FETCH p.tags t
    LEFT JOIN FETCH p.productLocations pl
    LEFT JOIN FETCH pl.location l
    LEFT JOIN FETCH l.room r
    WHERE p.deletedAt IS NULL
    AND (:name IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')))
    AND (:roomId IS NULL OR r.id = :roomId)
""")
Page<Product> findAllForList(
    @Param("name") String name,
    @Param("roomId") UUID roomId,
    Pageable pageable
);
```

For photos on the list view, fetch only the cover photo (sort_order = 0) in a separate batch query keyed on entity IDs — never inside a per-product loop:

```java
// PhotoRepository
@Query("""
    SELECT ph FROM Photo ph
    WHERE ph.entityType = 'product'
    AND ph.entityId IN :productIds
    AND ph.sortOrder = 0
    AND ph.deletedAt IS NULL
""")
List<Photo> findCoverPhotos(@Param("productIds") List<UUID> productIds);
```

Call `findCoverPhotos` once after the page query, then assemble DTOs in-memory. This reduces 20 photo queries to 1.

### Risk: Room detail endpoint

`GET /api/rooms/{id}` must show location list with item counts. Without eager loading of ProductLocations, this hits N queries for N locations.

### Fix: Aggregate count in a single query

```java
@Query("""
    SELECT l.id AS locationId, COUNT(pl.id) AS itemCount
    FROM Location l
    LEFT JOIN l.productLocations pl ON pl.deletedAt IS NULL
    WHERE l.room.id = :roomId AND l.deletedAt IS NULL
    GROUP BY l.id
""")
List<LocationCountProjection> countItemsByRoom(@Param("roomId") UUID roomId);
```

Return this as a `Map<UUID, Long>` and merge with the location list in the service layer.

### Entity fetch strategy

Set all `@OneToMany` and `@ManyToMany` associations to `FetchType.LAZY` unconditionally. Use `JOIN FETCH` only in the specific queries that need the associated data. Never use `FetchType.EAGER` on collection associations — it breaks pagination and produces cross joins.

```java
@ManyToMany(fetch = FetchType.LAZY)
@JoinTable(name = "product_tag", ...)
private Set<Tag> tags = new HashSet<>();

@OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
private List<ProductLocation> productLocations = new ArrayList<>();
```

---

## 2. Image Upload and Download Performance

### Risk: Synchronous upload blocks the request thread

The spec says upload can be `@Async` "if necessary." Make it mandatory from day one. A synchronous MinIO PUT on a slow local Docker network can take 500ms–2s, blocking a Tomcat thread for that entire duration.

### Fix: Async upload with CompletableFuture

```java
// PhotoService
@Async("photoExecutor")
public CompletableFuture<String> uploadAsync(MultipartFile file, String objectKey) {
    try {
        storageService.put(objectKey, file.getInputStream(), file.getContentType());
        return CompletableFuture.completedFuture(objectKey);
    } catch (Exception e) {
        return CompletableFuture.failedFuture(e);
    }
}
```

```java
// application.yml — dedicated thread pool for photo uploads
spring:
  task:
    execution:
      pool:
        core-size: 2
        max-size: 4
        queue-capacity: 10
      thread-name-prefix: photo-upload-
```

For the upload endpoint itself, return `202 Accepted` with the photo ID immediately and let the client poll or rely on optimistic UI. The photo record is written synchronously (to get the ID); the MinIO PUT happens on the background thread.

### Risk: Thumbnail generation is not mentioned

Serving full-resolution photos on product cards is wasteful. The spec mentions a thumbnail in the card grid but does not describe thumbnail generation.

### Fix: Generate thumbnails on upload using Thumbnailator

Add Thumbnailator to `pom.xml`:

```xml
<dependency>
    <groupId>net.coobird</groupId>
    <artifactId>thumbnailator</artifactId>
    <version>0.4.20</version>
</dependency>
```

In the async upload handler, generate two variants before uploading:

```java
// Generate 300x300 thumbnail alongside the original
ByteArrayOutputStream thumbOut = new ByteArrayOutputStream();
Thumbnails.of(file.getInputStream())
    .size(300, 300)
    .outputFormat("webp")  // or "jpeg" if webp unavailable
    .toOutputStream(thumbOut);

String thumbKey = objectKey.replace("/originals/", "/thumbs/");
storageService.put(thumbKey, new ByteArrayInputStream(thumbOut.toByteArray()), "image/webp");
```

Store both `url` (original) and `thumb_url` in the `Photo` table. Add a `thumb_url VARCHAR(500)` column via a Flyway migration.

### Risk: No file size or type validation before MinIO

Uploading a 50 MB video will consume thread time and MinIO bandwidth before the validation can reject it.

### Fix: Validate in the controller before streaming

```java
// PhotoController
private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
private static final Set<String> ALLOWED_TYPES = Set.of(
    "image/jpeg", "image/png", "image/webp", "image/heic"
);

if (file.getSize() > MAX_FILE_SIZE) {
    throw new ValidationException("File exceeds 10 MB limit");
}
if (!ALLOWED_TYPES.contains(file.getContentType())) {
    throw new ValidationException("Unsupported file type: " + file.getContentType());
}
```

Also configure Spring's multipart limit:

```yaml
# application.yml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 32MB
```

---

## 3. Search Performance

### Risk: ILIKE with no index is a full table scan

The spec explicitly chooses `ILIKE` for name/description search. On a table with thousands of products, `WHERE LOWER(name) ILIKE '%sofa%'` cannot use a standard B-tree index. PostgreSQL must scan every row.

### Fix: pg_trgm GIN index

Add this via Flyway migration:

```sql
-- V3__search_indexes.sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_product_name_trgm
    ON product USING GIN (name gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_product_description_trgm
    ON product USING GIN (description gin_trgm_ops)
    WHERE deleted_at IS NULL;
```

With these indexes, `ILIKE '%sofa%'` uses the trigram index and becomes fast even on large datasets. No application code changes are required — keep using ILIKE in the JPQL query.

### Risk: Search with room + tag filters generates an expensive JOIN chain

The search endpoint (`GET /api/search?q=&room=&tag=`) joins Product → ProductLocation → Location → Room and Product → ProductTag → Tag in the same query. Without proper index coverage, this explodes in query cost.

### Fix: Composite partial indexes on junction tables

```sql
-- V3__search_indexes.sql (continued)

-- Covers the room filter path
CREATE INDEX idx_product_location_active
    ON product_location (product_id, location_id)
    WHERE deleted_at IS NULL;

-- Covers FK traversal from location to room
CREATE INDEX idx_location_room_active
    ON location (room_id, id)
    WHERE deleted_at IS NULL;

-- Covers tag filter path
CREATE INDEX idx_product_tag_tag
    ON product_tag (tag_id, product_id);

-- Covers deleted_at filter on product (most selective predicate)
CREATE INDEX idx_product_active
    ON product (deleted_at)
    WHERE deleted_at IS NULL;
```

The partial index (`WHERE deleted_at IS NULL`) keeps the index small and means the optimizer always uses it for active-record queries.

### Fix: Use Specifications or Criteria API for dynamic search filters

Avoid building JPQL string concatenation. Use Spring Data JPA `Specification` to compose predicates:

```java
public static Specification<Product> activeProducts() {
    return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
}

public static Specification<Product> nameContains(String q) {
    return (root, query, cb) ->
        cb.like(cb.lower(root.get("name")), "%" + q.toLowerCase() + "%");
}

public static Specification<Product> inRoom(UUID roomId) {
    return (root, query, cb) -> {
        Join<Product, ProductLocation> pl = root.join("productLocations", JoinType.INNER);
        Join<ProductLocation, Location> loc = pl.join("location", JoinType.INNER);
        return cb.equal(loc.get("room").get("id"), roomId);
    };
}
```

Combine with `Specification.where(activeProducts()).and(nameContains(q)).and(inRoom(roomId))`. This generates correct SQL without string manipulation and allows Spring Data to count correctly for pagination.

---

## 4. Frontend Performance (Bundle Size, Core Web Vitals, Image Loading)

### Risk: Poppins font from Google Fonts blocks rendering

Loading Poppins as an external Google Fonts `@import` in CSS adds a render-blocking round-trip to Google's CDN before any text renders. This directly damages LCP (Largest Contentful Paint).

### Fix: Use next/font with self-hosting

```typescript
// src/app/layout.tsx
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '700', '800'],
  display: 'swap',
  preload: true,
  variable: '--font-poppins',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={poppins.variable}>
      ...
    </html>
  );
}
```

`next/font` downloads the font at build time, self-hosts it, and injects preload hints automatically. Zero external font requests at runtime. This is the single biggest LCP win available in the spec.

### Risk: Product grid renders full-resolution images

The card grid shows thumbnails. Without explicit `sizes` on `<Image>`, Next.js generates an oversized srcset, causing mobile devices to download a 1200px image when they need a 300px thumbnail.

### Fix: Configure next/image with sizes and placeholder

```tsx
// ProductCard.tsx
<Image
  src={product.thumbUrl}
  alt={product.name}
  width={300}
  height={300}
  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
  placeholder="blur"
  blurDataURL={product.blurHash}  // generate a 10x10 base64 blur on upload
  className="rounded-2xl object-cover"
/>
```

Mark the first visible row of cards with `priority` to preload LCP images:

```tsx
<Image ... priority={index < 4} />
```

Configure the MinIO domain in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/catalog/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
```

### Risk: Glassmorphism effects (backdrop-filter) on every card cause GPU overdraw

The spec calls for `backdrop-filter: blur(20px)` on all cards. On mobile, applying blur to every card in a scrolling grid causes continuous GPU compositing — this is a known killer of Interaction to Next Paint (INP) on mid-range phones.

### Fix: Restrict backdrop-blur to headers and modals only

Replace card glassmorphism with a solid semi-transparent background using `bg-white/60` or a direct `#fff5f8` fill. Reserve `backdrop-blur` for the bottom navigation bar and modal overlays, where only one element is blurred at a time.

```tsx
// Before (expensive on every card)
<div className="backdrop-blur-xl bg-white/20 rounded-2xl">

// After (GPU-friendly on cards)
<div className="bg-[#fff5f8]/90 border border-[#f48fb1]/30 rounded-2xl">
```

### Risk: Photo carousel in Product Detail has no lazy loading strategy

The spec describes a 3-photo carousel. If all 3 original images are loaded on mount, the product detail page costs up to 30 MB of image data.

### Fix: Load only the active slide, preload the next

```tsx
<Image
  src={photos[activeIndex].url}
  alt="..."
  priority={activeIndex === 0}
  loading={activeIndex === 0 ? 'eager' : 'lazy'}
/>
```

Use `rel="preload"` via Next.js `<Head>` only for slide index `activeIndex + 1`.

### Bundle size

Since the spec uses Next.js 15 App Router with React Server Components by default, keep all data fetching in Server Components. Client components should be limited to:

- The search input (needs `useState`)
- The photo carousel (needs `useState` for active slide)
- The tag autocomplete (needs `useState` + `useCallback`)
- The FAB (needs `onClick`)

Everything else — product cards, room cards, breadcrumbs, tag badges — should be Server Components with zero client JS.

Audit the bundle with `ANALYZE=true next build` using `@next/bundle-analyzer` and target a First Load JS under 80 KB for the home route.

---

## 5. Docker Resource Allocation

The spec says "resource limits" but gives no values. Without limits, a single slow MinIO upload can allow the Java heap to grow unchecked and cause the `db` container to OOM-kill PostgreSQL.

### Concrete resource limits for docker-compose.yml

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 768M
        reservations:
          cpus: '0.25'
          memory: 512M

  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M

  db:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.1'
          memory: 256M

  minio:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.1'
          memory: 128M
```

Set the JVM heap explicitly in the backend Dockerfile to stay inside the container limit:

```dockerfile
# backend/Dockerfile (runtime stage)
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

G1GC is appropriate here: it targets predictable pause times, which matters for API response time consistency. ZGC would be a valid alternative if pauses need to be sub-millisecond, but it requires more memory headroom.

Also set PostgreSQL shared_buffers inside the db container:

```yaml
  db:
    command: >
      postgres
        -c shared_buffers=128MB
        -c effective_cache_size=384MB
        -c work_mem=4MB
        -c maintenance_work_mem=64MB
        -c checkpoint_completion_target=0.9
        -c wal_buffers=16MB
        -c default_statistics_target=100
```

These values are calibrated for a 512 MB container limit. `shared_buffers` at 25% of the container memory is the standard starting point.

---

## 6. Database Query Patterns and Optimization

### HikariCP connection pool tuning

The spec says "configured with min/max connections" without specifying values. The default of 10 max connections is often too high for a single-instance personal app on constrained hardware, but the pool must be sized relative to PostgreSQL's `max_connections`.

```yaml
# application.yml (prod profile)
spring:
  datasource:
    hikari:
      minimum-idle: 2
      maximum-pool-size: 10
      connection-timeout: 3000      # fail fast if no connection in 3s
      idle-timeout: 300000          # release idle connections after 5 min
      max-lifetime: 600000          # recycle connections after 10 min
      leak-detection-threshold: 5000 # warn if connection held > 5s
```

Set PostgreSQL's `max_connections` to 20 (in the compose command above) to leave headroom for admin connections.

### UUID primary keys: use version 7 not version 4

The spec says UUID as PK to avoid sequential exposure. UUID v4 is random, which causes B-tree index fragmentation (random inserts scatter pages). UUID v7 is time-ordered (monotonically increasing prefix) and eliminates index fragmentation entirely, while still being non-guessable.

In Java 21, use a utility:

```java
// UuidUtils.java
import java.util.UUID;

public final class UuidUtils {
    public static UUID generateV7() {
        long timestamp = System.currentTimeMillis();
        long msb = (timestamp << 16) | 0x7000L | (ThreadLocalRandom.current().nextLong() & 0x0FFFL);
        long lsb = (ThreadLocalRandom.current().nextLong() & 0x3FFFFFFFFFFFFFFFL) | 0x8000000000000000L;
        return new UUID(msb, lsb);
    }
}
```

Or use the `uuid-creator` library (1 dependency, zero transitive deps):

```xml
<dependency>
    <groupId>com.github.f4b6a3</groupId>
    <artifactId>uuid-creator</artifactId>
    <version>6.0.0</version>
</dependency>
```

```java
import com.github.f4b6a3.uuid.UuidCreator;
UUID id = UuidCreator.getTimeOrderedEpoch(); // UUID v7
```

This is a zero-cost correctness improvement that prevents index bloat as the product count grows.

### Soft delete and query performance

The spec uses `WHERE deleted_at IS NULL` in all queries. Hibernate's `@Where` annotation on the entity applies this filter to every query automatically. The risk is that Hibernate may not use the partial index created above if the filter is injected in a way the planner doesn't recognize.

Verify with `EXPLAIN ANALYZE` that the partial index is being used. If not, make the condition explicit in JPQL rather than relying solely on `@Where`:

```java
// Explicit in JPQL (index-friendly)
WHERE p.deletedAt IS NULL AND l.deletedAt IS NULL
```

Add `EXPLAIN` output to the `DEBUG` logging profile during development:

```yaml
# application-dev.yml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
    org.hibernate.stat: DEBUG
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: 100
```

---

## 7. Caching Strategy

### What to cache and where

| Data | Staleness tolerance | Strategy | Location |
|---|---|---|---|
| Tag list | Minutes | HTTP `Cache-Control: max-age=300` on GET /api/tags | Spring response header |
| Room list | Minutes | HTTP `Cache-Control: max-age=60` on GET /api/rooms | Spring response header |
| Product list page | Seconds | No cache (search filters make it dynamic) | None |
| Product detail | Seconds | HTTP `ETag` + `Last-Modified` | Spring + Hibernate |
| MinIO presigned URLs | URL TTL | Browser cache via response headers | MinIO + CDN |
| Static assets (Next.js) | Forever | `Cache-Control: public, max-age=31536000, immutable` | Automatic via Next.js |

### HTTP caching in Spring Boot

Add a reusable filter or use `ResponseEntity` headers for read endpoints:

```java
// RoomController
@GetMapping
public ResponseEntity<List<RoomResponse>> listRooms() {
    List<RoomResponse> rooms = roomService.findAll();
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
        .body(rooms);
}

// TagController
@GetMapping
public ResponseEntity<List<TagResponse>> listTags() {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(300, TimeUnit.SECONDS).cachePublic())
        .body(tagService.findAll());
}
```

For product detail, use ETag based on `updated_at`:

```java
@GetMapping("/{id}")
public ResponseEntity<ProductResponse> getProduct(
        @PathVariable UUID id,
        WebRequest request) {
    ProductResponse product = productService.findById(id);
    String etag = "\"" + product.updatedAt().toEpochMilli() + "\"";
    if (request.checkNotModified(etag)) {
        return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
    }
    return ResponseEntity.ok().eTag(etag).body(product);
}
```

### Next.js caching alignment

In Server Components that fetch data, use the `cache` option on `fetch` calls to align with the HTTP cache strategy:

```typescript
// src/lib/api.ts
export async function getRooms() {
  const res = await fetch(`${API_BASE}/api/rooms`, {
    next: { revalidate: 60 }, // revalidate every 60s (matches backend Cache-Control)
  });
  return res.json();
}

export async function getTags() {
  const res = await fetch(`${API_BASE}/api/tags`, {
    next: { revalidate: 300 },
  });
  return res.json();
}

export async function getProduct(id: string) {
  const res = await fetch(`${API_BASE}/api/products/${id}`, {
    next: { revalidate: 10 },
  });
  return res.json();
}
```

This gives the home page rooms and tags from Next.js's server-side cache on subsequent requests, avoiding a backend round-trip on every visitor.

---

## 8. MinIO Performance (Presigned URLs vs Proxy)

### The spec says "presigned URLs or proxy" — choose presigned URLs

Proxying images through Spring Boot means every image request consumes a Tomcat thread, a HikariCP connection check, and Spring's servlet pipeline. For a photo-heavy product detail page (3 photos), this is 3 concurrent threads blocked on I/O reads from MinIO.

Presigned URLs bypass the backend entirely: the browser fetches directly from MinIO over Docker's internal network exposed port. This is the correct choice.

### Presigned URL configuration

```java
// MinioStorageService.java
public String generatePresignedUrl(String objectKey) {
    GetPresignedObjectUrlArgs args = GetPresignedObjectUrlArgs.builder()
        .method(Method.GET)
        .bucket(bucket)
        .object(objectKey)
        .expiry(7, TimeUnit.DAYS)   // 7 days: long enough to avoid re-generation
        .build();
    return minioClient.getPresignedObjectUrl(args);
}
```

Store the presigned URL in the database (`Photo.url`). Regenerate it in a scheduled job before it expires:

```java
@Scheduled(cron = "0 0 2 * * *")  // 2 AM daily
public void refreshExpiredPresignedUrls() {
    // Find photos with url_expires_at < NOW() + INTERVAL '1 day'
    // Regenerate and update
}
```

Add `url_expires_at TIMESTAMP` to the `Photo` table via Flyway to track when regeneration is needed.

Alternatively, set presigned URL expiry to 1 year if the MinIO instance is private (Docker-only, no public exposure). For a personal app with no auth, a long-lived URL is acceptable and eliminates the regeneration job entirely.

### MinIO client connection pool

The default MinIO Java SDK uses OkHttp internally. Configure it explicitly:

```java
// MinioConfig.java
@Bean
public MinioClient minioClient() {
    OkHttpClient httpClient = new OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .connectionPool(new ConnectionPool(5, 5, TimeUnit.MINUTES))
        .build();

    return MinioClient.builder()
        .endpoint(minioEndpoint)
        .credentials(accessKey, secretKey)
        .httpClient(httpClient)
        .build();
}
```

A connection pool of 5 connections to MinIO is sufficient for this workload.

### MinIO tuning in Docker Compose

```yaml
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    # Disable erasure coding for a single-node personal app (reduces overhead)
    # Default single-disk mode is already non-erasure; no extra config needed.
```

For a single-node personal app, MinIO runs in single-drive mode which skips erasure coding overhead. No additional tuning is needed at the storage level.

---

## 9. Complete Database Migration for Performance Indexes

All performance indexes described above consolidated into a single Flyway script:

```sql
-- V3__performance_indexes.sql

-- Trigram search extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Product full-text search
CREATE INDEX idx_product_name_trgm
    ON product USING GIN (name gin_trgm_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_product_description_trgm
    ON product USING GIN (description gin_trgm_ops)
    WHERE deleted_at IS NULL;

-- Product active records (most common filter)
CREATE INDEX idx_product_active
    ON product (updated_at DESC)
    WHERE deleted_at IS NULL;

-- Location FK + active filter
CREATE INDEX idx_location_room_active
    ON location (room_id, id)
    WHERE deleted_at IS NULL;

-- ProductLocation junction table
CREATE INDEX idx_product_location_active
    ON product_location (product_id, location_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_product_location_location
    ON product_location (location_id)
    WHERE deleted_at IS NULL;

-- ProductTag junction table
CREATE INDEX idx_product_tag_tag
    ON product_tag (tag_id, product_id);

-- Photo lookup by entity (used in every product/location fetch)
CREATE INDEX idx_photo_entity
    ON photo (entity_type, entity_id, sort_order)
    WHERE deleted_at IS NULL;

-- Tag name (UNIQUE already creates an index, no additional needed)

-- Photo URL expiry (for presigned URL regeneration job)
ALTER TABLE photo ADD COLUMN IF NOT EXISTS url_expires_at TIMESTAMP;
CREATE INDEX idx_photo_url_expiry ON photo (url_expires_at) WHERE url_expires_at IS NOT NULL;
```

---

## 10. Summary of Concrete Changes to the Spec

| Area | Issue in spec | Concrete fix |
|---|---|---|
| N+1 queries | Not addressed | JOIN FETCH queries + batch cover photo fetch |
| Thumbnails | Not mentioned | Thumbnailator on upload, store `thumb_url`, 300x300 WebP |
| Async upload | "if necessary" | Mandatory from day one, dedicated thread pool |
| File validation | Not mentioned | Size + MIME check in controller before streaming |
| Search indexes | "ILIKE" with no index guidance | pg_trgm GIN indexes via Flyway V3 |
| Partial indexes | Not specified | Partial indexes on all `WHERE deleted_at IS NULL` queries |
| UUID v4 | Specified | Upgrade to UUID v7 (time-ordered, no index fragmentation) |
| Font loading | "Poppins (Google Fonts)" | next/font self-hosted at build time |
| Image sizes | Not mentioned | `sizes` attribute + `priority` on first row + blur placeholder |
| Glassmorphism | All cards | Restrict backdrop-blur to nav/modals only |
| Docker limits | "configured" (no values) | Specific CPU/memory values per container |
| JVM heap | Not specified | `-Xms256m -Xmx512m -XX:+UseG1GC` |
| PostgreSQL params | Not specified | `shared_buffers`, `work_mem`, `checkpoint_completion_target` |
| HikariCP | "configured" (no values) | Specific values: min=2, max=10, leak-detection=5s |
| HTTP caching | "ETag and Cache-Control" | Specific `max-age` values per endpoint type |
| Next.js caching | Not mentioned | `next: { revalidate: N }` aligned with backend headers |
| MinIO URLs | "presigned or proxy" | Presigned with 7-day expiry + `url_expires_at` column |
| MinIO client | Not mentioned | Explicit OkHttp connection pool (5 connections) |
| Search filters | Not mentioned | Spring Data `Specification` for dynamic predicate composition |
| Hibernate stats | Not mentioned | Log queries slower than 100ms in dev profile |
