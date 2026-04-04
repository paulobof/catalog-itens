# Catalog Itens — PRD & Design Spec

## Visão Geral

Aplicação web responsiva (PWA) para catalogar itens da casa, organizados por cômodos e locais de armazenamento. Uso pessoal, sem autenticação. Tema visual Barbie (paleta rosa/pink/magenta).

## Stack Técnico

| Camada      | Tecnologia                                    |
|-------------|-----------------------------------------------|
| Frontend    | Next.js 15, React 19, Tailwind CSS, SWR       |
| Backend     | Spring Boot 3.4, Java 21, Lombok              |
| Banco       | PostgreSQL 16 + pg_trgm                       |
| Storage     | MinIO (S3-compatible)                          |
| Migrations  | Flyway                                         |
| Validação   | Jakarta Bean Validation                        |
| Testes      | JUnit 5, Mockito, Testcontainers, Playwright   |
| Deploy      | Docker Compose (5 containers)                  |

---

## Arquitetura

Monolito Spring Boot simples, organizado por domínio. Frontend Next.js com App Router e Server Components.

### Containers Docker

| Container   | Imagem                       | Porta  | Exposição    |
|-------------|------------------------------|--------|--------------|
| frontend    | Node 22 Alpine (Next.js)     | 3000   | Host         |
| backend     | Eclipse Temurin 21 JRE Alpine| 8080   | Interno      |
| db          | postgres:16-alpine           | 5432   | Interno (dev: host) |
| minio       | minio/minio                  | 9000   | Interno      |
| minio-init  | minio/mc                     | —      | One-shot     |

> Apenas a porta 3000 (frontend) é exposta ao host em produção. Backend, DB e MinIO são acessíveis apenas pela rede interna Docker.

### Redes Docker

| Rede          | Serviços                      | Tipo     |
|---------------|-------------------------------|----------|
| frontend-net  | frontend                      | bridge   |
| app-net       | frontend, backend, minio      | bridge   |
| db-net        | backend, db                   | internal |

### Fluxo de Requisição

```
Browser → Next.js (:3000) → REST API → Spring Boot (:8080) → PostgreSQL (:5432)
                                                             → MinIO (:9000) [fotos]

Upload de fotos:
Browser → Next.js Server Action → Spring Boot (:8080) → MinIO (:9000)

Exibição de fotos:
Spring Boot gera presigned URL (15min TTL) → Browser busca direto do MinIO via proxy
```

### Variáveis de Ambiente

```bash
# Backend (Spring Boot)
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/catalog_itens?TimeZone=UTC
SPRING_DATASOURCE_USERNAME=catalog
SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD}
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
MINIO_BUCKET=catalog-photos
SPRING_PROFILES_ACTIVE=prod

# Frontend (Next.js)
API_URL=http://backend:8080           # server-side (RSC, Server Actions)
NEXT_PUBLIC_API_URL=http://localhost:3000/api  # client-side (proxy via route handler)

# PostgreSQL
POSTGRES_DB=catalog_itens
POSTGRES_USER=catalog
POSTGRES_PASSWORD=<em .env, nunca commitado>

# MinIO
MINIO_ROOT_USER=<em .env>
MINIO_ROOT_PASSWORD=<em .env>
```

> Segredos ficam em `.env` (no `.gitignore`). Um `.env.example` é commitado com valores placeholder.

---

## Modelo de Dados

> Todas as colunas temporais usam `TIMESTAMPTZ` (com timezone). Todos os UUIDs são **v7** (time-ordered) para performance de índice B-tree.

### Room (Cômodo)

| Campo       | Tipo           | Notas                  |
|-------------|----------------|------------------------|
| id          | UUID v7        | PK, DEFAULT uuid_v7()  |
| name        | VARCHAR(100)   | NOT NULL               |
| description | TEXT           | Opcional               |
| created_at  | TIMESTAMPTZ    | NOT NULL DEFAULT now() |
| updated_at  | TIMESTAMPTZ    | NOT NULL DEFAULT now() |
| deleted_at  | TIMESTAMPTZ    | NULL = ativo           |

### Location (Local de armazenamento)

| Campo       | Tipo           | Notas                           |
|-------------|----------------|---------------------------------|
| id          | UUID v7        | PK                              |
| room_id     | UUID           | FK → Room, NOT NULL, ON DELETE RESTRICT |
| name        | VARCHAR(100)   | NOT NULL                        |
| description | TEXT           | Opcional                        |
| created_at  | TIMESTAMPTZ    | NOT NULL DEFAULT now()          |
| updated_at  | TIMESTAMPTZ    | NOT NULL DEFAULT now()          |
| deleted_at  | TIMESTAMPTZ    | NULL = ativo                    |

### Product (Produto/Item)

| Campo         | Tipo           | Notas                              |
|---------------|----------------|------------------------------------|
| id            | UUID v7        | PK                                 |
| name          | VARCHAR(150)   | NOT NULL                           |
| description   | TEXT           | Opcional                           |
| search_vector | TSVECTOR       | GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(name,'') \|\| ' ' \|\| coalesce(description,''))) STORED |
| created_at    | TIMESTAMPTZ    | NOT NULL DEFAULT now()             |
| updated_at    | TIMESTAMPTZ    | NOT NULL DEFAULT now()             |
| deleted_at    | TIMESTAMPTZ    | NULL = ativo                       |

### ProductLocation (Junção N:N com quantidade)

| Campo       | Tipo           | Notas                              |
|-------------|----------------|------------------------------------|
| id          | UUID v7        | PK                                 |
| product_id  | UUID           | FK → Product, NOT NULL, ON DELETE CASCADE |
| location_id | UUID           | FK → Location, NOT NULL, ON DELETE CASCADE |
| quantity    | INTEGER        | NOT NULL, DEFAULT 1, CHECK (quantity > 0) |
| created_at  | TIMESTAMPTZ    | NOT NULL DEFAULT now()             |
| updated_at  | TIMESTAMPTZ    | NOT NULL DEFAULT now()             |
| deleted_at  | TIMESTAMPTZ    | NULL = ativo                       |

Constraint: `UNIQUE(product_id, location_id) WHERE deleted_at IS NULL` (partial unique index)

### Tag

| Campo      | Tipo           | Notas                          |
|------------|----------------|--------------------------------|
| id         | UUID v7        | PK                             |
| name       | VARCHAR(50)    | NOT NULL                       |
| color      | TEXT           | CHECK (color ~ '^#[0-9a-fA-F]{6}$') |
| created_at | TIMESTAMPTZ    | NOT NULL DEFAULT now()         |
| deleted_at | TIMESTAMPTZ    | NULL = ativo                   |

Constraint: `UNIQUE(name) WHERE deleted_at IS NULL` (partial unique index)

### ProductTag (Junção N:N)

| Campo      | Tipo | Notas                    |
|------------|------|--------------------------|
| product_id | UUID | FK → Product, ON DELETE CASCADE |
| tag_id     | UUID | FK → Tag, ON DELETE CASCADE     |

PK composta: (product_id, tag_id). Hard delete (não usa soft delete — associação simples e recriável).

### Photo

| Campo             | Tipo           | Notas                              |
|-------------------|----------------|------------------------------------|
| id                | UUID v7        | PK                                 |
| entity_type       | TEXT           | NOT NULL, CHECK (entity_type IN ('product', 'location', 'room')) |
| entity_id         | UUID           | NOT NULL                           |
| object_key        | TEXT           | NOT NULL — chave no MinIO (ex: photos/product/{id}/{uuid}.webp) |
| original_filename | VARCHAR(255)   | NOT NULL                           |
| content_type      | VARCHAR(100)   | NOT NULL                           |
| file_size         | BIGINT         | NOT NULL (bytes)                   |
| sort_order        | INTEGER        | NOT NULL, DEFAULT 0, CHECK (sort_order >= 0) |
| created_at        | TIMESTAMPTZ    | NOT NULL DEFAULT now()             |
| deleted_at        | TIMESTAMPTZ    | NULL = ativo                       |

Constraints:
- Máximo 3 fotos por (entity_type, entity_id) — validado na aplicação
- `entity_type` usa TEXT + CHECK em vez de ENUM (evita problemas transacionais com Flyway)
- Armazena `object_key` (não URL completa) para portabilidade — presigned URLs geradas no runtime

### Relacionamentos

- **Room 1:N Location** — Um cômodo contém vários locais. ON DELETE RESTRICT.
- **Product N:N Location** — Via ProductLocation, com quantidade por local. ON DELETE CASCADE.
- **Product N:N Tag** — Via ProductTag (hard delete). ON DELETE CASCADE.
- **Photo → Product | Location | Room** — Polimórfica, até 3 por entidade, armazenada no MinIO.

### Cascade de Soft Delete

| Ação                  | Efeito                                              |
|-----------------------|-----------------------------------------------------|
| Soft-delete Room      | Cascade soft-delete todos Locations e seus ProductLocations |
| Soft-delete Location  | Cascade soft-delete todos ProductLocations deste local      |
| Soft-delete Product   | Cascade soft-delete ProductLocations, hard-delete ProductTags, soft-delete Photos |
| Soft-delete Tag       | Hard-delete todos ProductTags desta tag                     |

### Índices

```sql
-- FK indexes (PostgreSQL não cria automaticamente)
CREATE INDEX idx_location_room_id              ON location (room_id);
CREATE INDEX idx_product_location_product_id   ON product_location (product_id);
CREATE INDEX idx_product_location_location_id  ON product_location (location_id);
CREATE INDEX idx_product_tag_tag_id            ON product_tag (tag_id);
CREATE INDEX idx_photo_entity                  ON photo (entity_type, entity_id);

-- Partial indexes (apenas registros ativos)
CREATE INDEX idx_room_active_name              ON room (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_location_active_room_name     ON location (room_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_location_active       ON product_location (product_id, location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_photo_active_entity_order     ON photo (entity_type, entity_id, sort_order) INCLUDE (object_key) WHERE deleted_at IS NULL;

-- Partial unique indexes (substitui UNIQUE simples para funcionar com soft delete)
CREATE UNIQUE INDEX uq_product_location_active ON product_location (product_id, location_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_tag_name_active         ON tag (name) WHERE deleted_at IS NULL;

-- Full-text search (GIN com tsvector para busca em português)
CREATE INDEX idx_product_search_vector         ON product USING gin (search_vector) WHERE deleted_at IS NULL;

-- Trigram para ILIKE em queries curtas (< 3 chars)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_product_name_trgm             ON product USING gin (name gin_trgm_ops) WHERE deleted_at IS NULL;

-- Cursor pagination
CREATE INDEX idx_product_active_name_id        ON product (name, id) WHERE deleted_at IS NULL;
```

### Trigger updated_at

```sql
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Aplicado em: room, location, product, product_location, tag
```

### Flyway Migrations

```
V1__create_extensions.sql          -- pg_trgm, uuid_generate_v7 function
V2__create_tables.sql              -- all CREATE TABLE
V3__create_indexes.sql             -- all CREATE INDEX
V4__create_triggers.sql            -- updated_at triggers
V5__add_check_constraints.sql      -- quantity > 0, color regex, sort_order >= 0
```

---

## API REST

### Rooms

| Método | Endpoint              | Status | Descrição                    |
|--------|-----------------------|--------|------------------------------|
| GET    | /api/rooms            | 200    | Listar cômodos               |
| POST   | /api/rooms            | 201    | Criar cômodo                 |
| GET    | /api/rooms/{id}       | 200    | Detalhe com locais e contagem|
| PUT    | /api/rooms/{id}       | 200    | Atualizar cômodo             |
| DELETE | /api/rooms/{id}       | 204    | Soft-delete cômodo (cascade) |

### Locations

| Método | Endpoint                  | Status | Descrição               |
|--------|---------------------------|--------|-------------------------|
| GET    | /api/locations?roomId=    | 200    | Locais (filtro por room)|
| POST   | /api/locations            | 201    | Criar local (roomId no body) |
| GET    | /api/locations/{id}       | 200    | Detalhe com produtos    |
| PUT    | /api/locations/{id}       | 200    | Atualizar local         |
| DELETE | /api/locations/{id}       | 204    | Soft-delete local       |

### Products

| Método | Endpoint              | Status | Descrição                              |
|--------|-----------------------|--------|----------------------------------------|
| GET    | /api/products?q=&roomId=&tagId=&page=0&size=20 | 200 | Listar com busca e filtros |
| POST   | /api/products         | 201    | Criar produto                          |
| GET    | /api/products/{id}    | 200    | Detalhe com locais, tags e fotos       |
| PUT    | /api/products/{id}    | 200    | Atualizar produto                      |
| DELETE | /api/products/{id}    | 204    | Soft-delete produto (cascade)          |

### Product-Location (sub-resource)

| Método | Endpoint                              | Status | Descrição              |
|--------|---------------------------------------|--------|------------------------|
| POST   | /api/products/{id}/locations          | 201    | Associar produto ao local (locationId + quantity) |
| PUT    | /api/products/{id}/locations/{locId}  | 200    | Atualizar quantidade   |
| DELETE | /api/products/{id}/locations/{locId}  | 204    | Desassociar            |

### Tags

| Método | Endpoint        | Status | Descrição    |
|--------|-----------------|--------|--------------|
| GET    | /api/tags       | 200    | Listar todas |
| POST   | /api/tags       | 201    | Criar tag    |
| PUT    | /api/tags/{id}  | 200    | Atualizar (nome/cor) |
| DELETE | /api/tags/{id}  | 204    | Soft-delete tag |

### Photos (entity-scoped)

| Método | Endpoint                         | Status | Descrição                      |
|--------|----------------------------------|--------|--------------------------------|
| POST   | /api/products/{id}/photos        | 201    | Upload foto do produto (multipart) |
| POST   | /api/locations/{id}/photos       | 201    | Upload foto do local           |
| POST   | /api/rooms/{id}/photos           | 201    | Upload foto do cômodo          |
| PUT    | /api/{entity}/{id}/photos/reorder| 200    | Reordenar fotos (array de photoId + sortOrder) |
| DELETE | /api/photos/{id}                 | 204    | Remover foto (MinIO + banco)   |

### Paginação (response envelope)

```json
{
  "content": [ ... ],
  "page": {
    "number": 0,
    "size": 20,
    "totalElements": 142,
    "totalPages": 8
  }
}
```

Endpoints paginados: `GET /api/products`. Não paginados (low cardinality): `GET /api/rooms`, `GET /api/tags`.

### Erro (response padrão)

```json
{
  "timestamp": "2026-04-04T13:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Product not found with id: abc-123",
  "path": "/api/products/abc-123",
  "requestId": "req-xyz-789"
}
```

HTTP status codes: 200, 201, 204, 400, 404, 409, 500. Stack traces NUNCA incluídas na resposta.

---

## Telas (Frontend)

### Rotas Next.js App Router

```
src/app/
├��─ layout.tsx                    # Root layout: Poppins font, metadata, theme
├── (shell)/                      # Route group: bottom nav layout
│   ├── layout.tsx                # Bottom nav + FAB
│   ├── page.tsx                  # Home (busca + tabs)
│   └── search/page.tsx           # Search results
├── rooms/[id]/
│   ├── page.tsx                  # Room detail
│   ├── loading.tsx               # Skeleton
│   └── not-found.tsx
├���─ locations/[id]/
│   ├── page.tsx                  # Location detail
│   ├── loading.tsx
│   ��── not-found.tsx
├── products/
│   ├── [id]/
│   │   ├── page.tsx              # Product detail
│   │   ├── edit/page.tsx         # Edit form
│   │   ├── loading.tsx
│   │   ��── not-found.tsx
│   └── new/page.tsx              # Create form
├── error.tsx                     # Global error boundary
├── loading.tsx                   # Global loading
├── not-found.tsx                 # Global 404
└── manifest.ts                   # PWA manifest (Barbie theme)
```

### Server vs Client Components

| Componente                | Tipo    | Razão                             |
|---------------------------|---------|-----------------------------------|
| Home page (dados)         | Server  | Fetch rooms/products no server    |
| Tab switcher              | Client  | useState / URL params             |
| Room/Location/Product data| Server  | Fetch + render server-side        |
| Photo carousel            | Client  | Swipe, dots, touch events         |
| Product form              | Client  | Controlled inputs, file upload    |
| Image upload zone         | Client  | File API, drag & drop, preview    |
| Tag autocomplete          | Client  | Debounce, dropdown state          |
| Search input              | Client  | Debounce, useTransition           |
| Search results grid       | Server  | Dados via URL params, SSR         |
| FAB                       | Client  | Navegação / modal                 |
| Bottom navigation         | Server  | Links estáticos                   |
| Breadcrumb                | Server  | Array de segments                 |

### 1. Home (`/`)
- Campo de busca em destaque no topo
- Duas abas via URL state (`?tab=rooms` / `?tab=products`) — Suspense boundary
- Aba Cômodos: cards com ícone, nome, contagem de locais/itens
- Aba Produtos: grid de cards com thumbnail, nome, local, tags
- FAB (floating action button) para criar novo item — `fixed bottom-20 right-4`
- Bottom navigation: Home, Buscar, Tags

### 2. Room Detail (`/rooms/[id]`)
- Header com nome do cômodo e foto (se houver)
- Botão voltar
- Lista de locais com ícone, nome e contagem de itens
- FAB para adicionar local

### 3. Location Detail (`/locations/[id]`)
- Header com nome do local e foto (se houver)
- Breadcrumb: Cômodo > Local (com `aria-label="Breadcrumb"`)
- Grid de produtos neste local com quantidade
- FAB para adicionar produto neste local

### 4. Product Detail (`/products/[id]`)
- Carousel de fotos (até 3) com dots indicator e keyboard navigation (←/→)
- Nome, descrição
- Tags como badges coloridos
- Seção "Armazenado em" com badges de local + quantidade
- Quantidade total
- Botão editar

### 5. Product Form (`/products/new` e `/products/[id]/edit`)
- Campos: nome, descrição (React Hook Form)
- Upload de até 3 fotos com:
  - Drop zone (`border-dashed`, `accept="image/*"`, max 5MB/file)
  - Preview em 3 slots fixos, `×` para remover, drag handle para reorder
  - Upload batch no submit (não no file select — evita orphans no MinIO)
  - Progress bar per-slot durante submit
- Seleção de tags (autocomplete, criar nova inline)
- Seleção de locais com quantidade para cada
- Optimistic update via `useOptimistic` (React 19)

### 6. Search Results (`/search?q=&roomId=&tagId=`)
- Campo de busca no topo (debounce 300ms via `useTransition` + `router.replace`)
- Filtros: cômodo (dropdown), tags (toggle badges com scroll horizontal)
- Grid de resultados com highlight do match (`<mark>`)
- Empty state com SVG e "Limpar filtros"
- Todo estado de filtro no URL (bookmarkable, browser back funciona)

---

## Design System — Tema Barbie

### Paleta de Cores (Tailwind config)

```ts
// tailwind.config.ts → theme.extend.colors.barbie
colors: {
  barbie: {
    'bg-light': '#fce4ec',  // Background geral
    'bg-soft':  '#f8bbd0',  // Cards, surfaces
    accent:     '#f48fb1',  // Bordas (NÃO para texto — contraste insuficiente)
    primary:    '#ec407a',  // Botões, links
    dark:       '#c2185b',  // Hover, badges, ícones interativos
    text:       '#880e4f',  // Texto principal (5.8:1 contrast ratio ✓)
    'hot-pink': '#ff69b4',  // Destaques, gradientes
    surface:    '#fff5f8',  // Background de cards
  }
}
```

> **Contraste a11y**: `accent` (#f48fb1) NÃO deve ser usada para texto ou ícones interativos — ratio 1.5:1 contra bg-soft. Usar `dark` (#c2185b) ou `text` (#880e4f) para ícones.

### Tipografia

- Font: **Poppins** via `next/font/google` no root layout (self-hosted, sem request externo)
- Headings: weight 700-800
- Body: weight 400
- Labels/captions: weight 300

### Componentes

- Cards: `rounded-2xl`, sombra suave, `bg-barbie-surface/80` (sem backdrop-blur — performance mobile)
- Botões: gradiente rosa, `rounded-xl`, min 44x44px touch target
- Inputs: borda rosa, `rounded-xl`, focus ring `ring-barbie-primary`
- Tags: badges pequenos, cores variadas
- FAB: gradiente rosa, `rounded-xl`, sombra forte, `aria-label`
- Bottom nav: `<nav aria-label="Navegação principal">` com `<a>` e `aria-current="page"`
- Glassmorphism: reservado para bottom nav e modais APENAS (GPU-heavy no mobile)
- Toast: `role="status"` + `aria-live="polite"` no root layout

### Responsividade

- Mobile-first (base 320px)
- Tablet (≥768px): 2 colunas de cards
- Desktop (≥1024px): 3-4 colunas, layout com sidebar opcional
- Safe area: `pb-safe` para iOS bottom inset

### Acessibilidade (a11y)

- Photo carousel: `role="region"`, `aria-label="Fotos do produto"`, dots como `<button aria-label="Foto N de 3">`
- FAB: `<button aria-label="Adicionar novo item">`
- Tag toggles: `role="checkbox"` com `aria-checked`
- Drop zone: `tabIndex={0}`, keyboard handler, focus ring
- Focus trap em modais
- `aria-live="polite"` para contagem de resultados de busca
- `<meta name="robots" content="noindex, nofollow">` (app pessoal)

---

## Estrutura do Projeto

```
catalog-itens/
├── backend/
│   ├── src/main/java/com/catalogitens/
│   │   ├── room/           # controller, service, repository, entity, dto
│   │   ├── location/
│   │   ├─��� product/
│   │   ├── tag/
│   │   ├── photo/
│   │   ├── search/
│   │   └── config/         # MinioConfig, CorsConfig, WebConfig, SecurityHeaders
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/   # Flyway V1..V5
│   ├── Dockerfile           # Multi-stage: deps → build → runtime (JRE alpine)
���   ├── .dockerignore
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── app/             # Routes (ver seção Telas)
│   │   ├── components/
│   │   │   ├── ui/          # Button, Card, Badge, Input, Spinner, Toast
│   │   │   ├── layout/      # BottomNav, PageHeader, Breadcrumb, FAB
│   │   │   ├── photos/      # PhotoCarousel, PhotoUploadZone, PhotoSlot
│   │   │   ├── products/    # ProductCard, ProductForm, ProductGrid
│   │   │   ├── rooms/       # RoomCard
│   │   │   ├── locations/   # LocationCard
│   │   │   ├── search/      # SearchInput, SearchFilters, ResultCard
│   │   ���   └── tags/        # TagBadge, TagPicker
│   │   └── lib/
│   │       ├��─ api/
│   │       │   ├── client.ts    # Base fetchApi (X-Request-Id, error handling)
│   │       │   ├── rooms.ts
│   │       │   ├── locations.ts
│   │       │   ├── products.ts
│   │       │   ├── tags.ts
│   │       ��   ├── photos.ts
│   │       │   └── types.ts     # TypeScript interfaces matching backend DTOs
│   │       └── utils/
│   │           ├── cn.ts        # clsx + tailwind-merge
│   │           └── highlight.ts # Search term highlighting
│   ├── tailwind.config.ts    # Tema Barbie
│   ├── next.config.ts        # output: 'standalone', remotePatterns
│   ├── Dockerfile            # Multi-stage: deps → build → runner (node alpine)
│   ├── .dockerignore
│   └─�� package.json
├── docker-compose.yml         # Base (redes, volumes, services)
├── docker-compose.dev.yml     # Override: bind mounts, debug ports, watch
├── docker-compose.prod.yml    # Override: resource limits, restart, log limits
├── .env.example               # Template com placeholders
├── .gitignore
└── README.md
```

---

## Princípios de Engenharia

### SOLID

- **S — Single Responsibility**: Controller só roteia, Service só orquestra lógica, Repository só acessa dados.
- **O — Open/Closed**: `StorageService` interface → `MinioStorageService` impl. Novos storages sem alterar código existente.
- **L — Liskov Substitution**: DTOs e entities separados, sem herança frágil.
- **I — Interface Segregation**: interfaces coesas e pequenas.
- **D — Dependency Inversion**: Services dependem de abstrações. Injeção via constructor (`@RequiredArgsConstructor`).

### KISS

- Código simples e legível. Sem overengineering.
- Sem abstrações prematuras — só abstrair quando houver razão concreta.
- Nomes autoexplicativos, sem comentários desnecessários.
- Métodos curtos (< 20 linhas idealmente).

### Outras Boas Práticas

- **DRY**: lógica comum extraída apenas quando realmente duplicada.
- **Fail Fast**: validações no início dos métodos, exceptions claras.
- **DTO Pattern**: entities JPA nunca expostas na API. Request/Response DTOs separados.
- **Immutability**: DTOs como Java 21 Records (sem `@Builder` em Records — redundante).
- **Naming**: `CreateProductRequest`, `UpdateProductRequest` (inbound), `ProductDetailResponse`, `ProductSummaryResponse` (outbound).

---

## Lombok

| Anotação                                        | Onde                          |
|-------------------------------------------------|-------------------------------|
| `@Getter @Setter @NoArgsConstructor`             | Entities JPA (NÃO `@Data`)   |
| `@ToString(exclude = {"locations","tags","photos"})` | Entities com coleções    |
| `@EqualsAndHashCode(onlyExplicitlyIncluded = true)` | Entities (Include no `@Id`) |
| `@RequiredArgsConstructor`                       | Services (injeção via constructor) |
| `@Slf4j`                                         | Services, Controllers         |
| `@Builder`                                       | Entities quando útil (não em Records) |
| `@ConfigurationProperties`                       | Config records (MinioProperties, etc) |

> **`@Data` NÃO usar em entities JPA** — gera equals/hashCode em todos os campos, quebra Hibernate com lazy loading e `Set<>`.

---

## Backend — Padrões e Convenções

### JPA / Hibernate

- **Soft delete**: `@SQLDelete(sql = "UPDATE ... SET deleted_at = now() WHERE id = ?")` + `@SQLRestriction("deleted_at IS NULL")` (Hibernate 6, substitui `@Where` deprecated)
- **Todas associações LAZY**: todo `@ManyToOne` e `@OneToOne` com `fetch = FetchType.LAZY` explícito
- **`@EntityGraph`** para endpoints de detalhe (evita N+1)
- **`@SQLRestriction`** também nas coleções (`@OneToMany`) que apontam para entities soft-deleted
- **`@Transactional(readOnly = true)`** em todos os métodos de leitura
- **UUIDv7**: `@GeneratedValue(strategy = GenerationType.UUID)` ou deixar o banco gerar via `DEFAULT uuid_generate_v7()`

### Validação

- **`@Valid`** em todo `@RequestBody` (sem isso, Bean Validation é silenciosamente ignorada)
- **`@Validated`** no nível do controller (habilita validação em `@PathVariable` e `@RequestParam`)
- Regras:
  - Room/Location name: `@NotBlank @Size(max=100)`
  - Product name: `@NotBlank @Size(max=150)`
  - Tag name: `@NotBlank @Size(max=50)`
  - Tag color: `@Pattern(regexp="^#[0-9a-fA-F]{6}$")`
  - ProductLocation quantity: `@Min(1) @Max(99999)`
  - Search q: `@Size(max=200)`

### Exception Handling (`@RestControllerAdvice`)

| Exception                          | Status | Quando                      |
|------------------------------------|--------|-----------------------------|
| `ResourceNotFoundException`        | 404    | Entidade não encontrada     |
| `MethodArgumentNotValidException`  | 400    | @Valid falha                |
| `ConstraintViolationException`     | 400    | @Validated falha            |
| `DataIntegrityViolationException`  | 409    | UNIQUE constraint (tag name)|
| `PhotoLimitExceededException`      | 400    | > 3 fotos                  |
| `StorageException`                 | 500    | MinIO falha                 |
| `Exception` (catch-all)            | 500    | Erro genérico               |

> Stack traces NUNCA na resposta. `server.error.include-stacktrace=never`.

### Storage (MinIO)

- Interface `StorageService` → impl `MinioStorageService`
- `MinioException` NUNCA propaga para controller — wrappada em `StorageException`
- Config via `@ConfigurationProperties(prefix = "app.storage.minio")`: endpoint, accessKey, secretKey, bucketName, presignedUrlTtl
- Object key pattern: `photos/{entity-type}/{entity-id}/{photo-uuid}.{ext}`
- Presigned URLs: TTL configurável (default 1 hora), geradas no service layer
- Upload assíncrono via `@Async` com thread pool dedicado (`photoExecutor`, core=2, max=4)
- Bucket auto-criado pelo `minio-init` container no compose

### File Upload Security

- **Whitelist MIME**: `image/jpeg`, `image/png`, `image/webp` apenas
- **Validação magic bytes**: verificar primeiros bytes do arquivo, não apenas Content-Type header
- **Max file size**: 5MB por foto (`spring.servlet.multipart.max-file-size=5MB`, `max-request-size=15MB`)
- **Filename**: gerar UUID server-side, nunca usar filename do cliente
- **Image re-encode**: usar Thumbnailator para decodificar e re-codificar (strip EXIF/GPS metadata, elimina polyglot payloads)
- **Thumbnail generation**: 300x300 WebP no upload, armazenado em MinIO como `thumbs/{...}`
- **MinIO bucket**: PRIVATE, presigned URLs para leitura, service account (não root)

---

## Observabilidade

### Logging

- **SLF4J + Logback** (via `@Slf4j` do Lombok)
- Logs estruturados em JSON (prod) via `logstash-logback-encoder`
- Console appender apenas (sem file appender — Docker log driver é o sink)
- Níveis:
  - `INFO`: operações de negócio (criação, deleção, upload)
  - `WARN`: validações que falham, recursos não encontrados, **todas operações DELETE**
  - `ERROR`: exceções não esperadas, falhas de integração (MinIO down)
  - `DEBUG`: queries, payloads (desabilitado em produção)
- **Correlation ID**: `X-Request-Id` propagado via MDC

### Métricas

- **Spring Boot Actuator** habilitado com lockdown:
  ```yaml
  management:
    endpoints.web.exposure.include: health,info
    endpoint.health.show-details: never
  ```
- Métricas via Micrometer (não expostas via Actuator em prod):
  - `catalog.products.total`, `catalog.photos.upload.duration`, `catalog.search.duration`

### Health Checks

- **DB**: auto-configurado pelo Spring Boot
- **MinIO**: `MinioHealthIndicator` customizado
- Endpoint: `GET /actuator/health`

---

## Segurança

### Threat Model

Mesmo sem autenticação, as seguintes ameaças se aplicam:
- Dispositivos na mesma rede WiFi podem acessar todas as APIs
- Upload de arquivos maliciosos
- Destruição acidental de dados
- Container comprometido → movimento lateral

### Defesas

1. **Network boundary**: apenas porta 3000 exposta ao host. Backend, DB e MinIO são internos Docker.
2. **Input validation**: Jakarta Bean Validation em todos DTOs. Path/query params validados.
3. **File upload**: whitelist MIME, magic bytes, re-encode, size limits, server-side filenames.
4. **SQL injection**: queries parametrizadas exclusivamente (Spring Data JPA / `@Query` com `:param`).
5. **CORS**: origin whitelist estrita (`http://localhost:3000` apenas), nunca `*`.
6. **Security headers** (Spring filter + Next.js `next.config.ts`):
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Content-Security-Policy: default-src 'self'`
   - `Referrer-Policy: strict-origin-when-cross-origin`
7. **Docker hardening**: non-root users, `cap_drop: ALL`, `no-new-privileges:true`, `read_only: true` + tmpfs.
8. **MinIO hardening**: private bucket, service account (não root), console desabilitado em prod.
9. **Actuator lockdown**: apenas `/health` e `/info` expostos, sem detalhes.
10. **Dependency scanning**: OWASP dependency-check (Maven), `npm audit` (frontend).
11. **Secrets**: `.env` no `.gitignore`, nunca hardcoded. `.env.example` commitado.

---

## Escalabilidade

### Backend

- **HikariCP**: minimum-idle=2, maximum-pool-size=10, connection-timeout=30s, max-lifetime=30min
- **PostgreSQL tuning**: `idle_in_transaction_session_timeout=30s`, `statement_timeout=10s`, `shared_buffers=128MB`
- **Paginação**: `Page<T>` com `?page=0&size=20&sort=name,asc` (cap max page size 50)
- **Full-text search**: `tsvector` + GIN index para busca em português (substitui ILIKE puro)
- **Async upload**: `@Async` com thread pool dedicado
- **Cache headers**: `ETag` baseado em `updated_at`, `Cache-Control` por tipo de endpoint

### Frontend

- **Server Components**: renderização no server por default
- **Dynamic import**: `ProductForm` carregado via `dynamic()` (code splitting)
- **Image optimization**: Next.js `<Image>` com `sizes` attribute, `priority` na primeira imagem
- **Font**: Poppins via `next/font/google` (self-hosted, zero external request)
- **Glassmorphism**: backdrop-blur apenas em bottom nav e modais (não em cards — jank no mobile)

### Docker

- **Multi-stage builds**: 4 stages (deps → build → test → runtime)
- **Resource limits**:
  - backend: 768M / 1 CPU (JVM: `-XX:MaxRAMPercentage=75.0`)
  - frontend: 256M / 0.5 CPU
  - db: 512M / 0.5 CPU
  - minio: 256M / 0.5 CPU
- **Health checks**: com `start-period: 60s` no backend (Flyway + Spring startup)
- **Log driver**: `json-file` com `max-size: 50m`, `max-file: 5`
- **Volumes nomeados**: `postgres_data`, `minio_data`
- **Backup**: `pg_dump` + `mc mirror` via compose separado (`docker-compose.backup.yml`)
- **`.dockerignore`**: em backend e frontend

---

## Decisões Técnicas

| Decisão | Rationale |
|---------|-----------|
| Soft delete com `deleted_at` | Recuperação de dados, auditoria |
| Partial unique indexes | UNIQUE funciona corretamente com soft delete |
| UUID v7 como PK | Time-ordered, sem fragmentação de B-tree |
| TIMESTAMPTZ (não TIMESTAMP) | Evita bugs de timezone entre JVM e DB |
| `@SQLRestriction` (não `@Where`) | Hibernate 6 — `@Where` é deprecated |
| `@Getter/@Setter` (não `@Data`) | Evita quebrar equals/hashCode em entities JPA |
| Records para DTOs | Imutabilidade nativa Java 21, sem Lombok |
| TEXT + CHECK (não ENUM) | Evita problemas transacionais Flyway com ALTER TYPE |
| `object_key` (não URL completa) | Portabilidade — URLs geradas em runtime |
| Photos entity-scoped API | RESTful, elimina polymorphic enum na API |
| `output: 'standalone'` Next.js | Obrigatório para Docker deployment |
| `pg_trgm` + GIN indexes | Busca ILIKE index-backed, sem full table scan |
| Console-only logging | Container-idiomatic, Docker log driver como sink |
| Sem autenticação | App pessoal, rede local. Network isolation como defesa. |
| ProductTag hard delete | Associação simples e recriável, não precisa de soft delete |

---

## Estratégia de Testes

Documento complementar completo em: `docs/superpowers/specs/2026-04-04-testing-strategy.md`