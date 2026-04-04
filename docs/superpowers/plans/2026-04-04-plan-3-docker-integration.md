# Plan 3: Docker & Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize the full stack with Docker Compose, configure networking, health checks, backup, and production hardening.

**Architecture:** 5 containers (frontend, backend, db, minio, minio-init) with 3 networks (frontend-net, app-net, db-net). Multi-stage Dockerfiles. Dev/prod compose overrides.

**Tech Stack:** Docker, Docker Compose, PostgreSQL 16, MinIO, Eclipse Temurin 21, Node 22 Alpine

---

## Task 1: Create `.env.example`

- [ ] Create file `D:\Projetos\catalog-itens\.env.example` with the following complete content:

```dotenv
# =============================================================================
# Catalog Itens — Environment Variables Template
# Copy this file to .env and fill in the secret values.
# NEVER commit .env to version control.
# =============================================================================

# -----------------------------------------------------------------------------
# PostgreSQL
# -----------------------------------------------------------------------------
POSTGRES_DB=catalog_itens
POSTGRES_USER=catalog
# REQUIRED: replace with a strong random password (e.g. openssl rand -base64 32)
POSTGRES_PASSWORD=changeme_strong_password_here

# -----------------------------------------------------------------------------
# MinIO
# -----------------------------------------------------------------------------
# REQUIRED: MinIO root credentials (admin user for minio-init bootstrap only)
MINIO_ROOT_USER=minioadmin
# REQUIRED: replace with a strong random password (minimum 8 characters)
MINIO_ROOT_PASSWORD=changeme_minio_root_password

# MinIO service account credentials used by the Spring Boot backend
# minio-init creates this account automatically on first startup
MINIO_ACCESS_KEY=catalog-service-account
# REQUIRED: replace with a strong random secret key (minimum 8 characters)
MINIO_SECRET_KEY=changeme_minio_secret_key_here

# Name of the bucket that stores all uploaded photos
MINIO_BUCKET=catalog-photos

# -----------------------------------------------------------------------------
# Backend (Spring Boot)
# -----------------------------------------------------------------------------
# Internal Docker network address — do not change unless you rename services
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/catalog_itens?TimeZone=UTC
SPRING_DATASOURCE_USERNAME=catalog
# References POSTGRES_PASSWORD above — keep in sync
SPRING_DATASOURCE_PASSWORD=changeme_strong_password_here

# Internal MinIO address — do not change unless you rename services
MINIO_ENDPOINT=http://minio:9000
# References service account credentials above
# MINIO_ACCESS_KEY and MINIO_SECRET_KEY are shared between this block and MinIO block above

# Active Spring profile: "prod" for production, "dev" for development
SPRING_PROFILES_ACTIVE=prod

# HikariCP connection pool
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=2
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=10
SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=30000
SPRING_DATASOURCE_HIKARI_MAX_LIFETIME=1800000

# File upload limits
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=5MB
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=15MB

# Presigned URL TTL in minutes (default: 60 minutes)
APP_STORAGE_MINIO_PRESIGNED_URL_TTL=60

# JVM memory — matched to docker-compose.prod.yml deploy.resources.limits
# MaxRAMPercentage=75 of the 768M container limit ≈ 576MB heap
JAVA_TOOL_OPTIONS=-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError

# -----------------------------------------------------------------------------
# Frontend (Next.js)
# -----------------------------------------------------------------------------
# Server-side URL (used by RSC and Server Actions inside the Docker network)
API_URL=http://backend:8080

# Client-side URL (used by browser JS — proxied through Next.js route handlers)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# -----------------------------------------------------------------------------
# Backup (docker-compose.backup.yml)
# -----------------------------------------------------------------------------
# Host directory where pg_dump files will be written
BACKUP_DIR=./backups

# MinIO mirror target bucket (mc mirror)
BACKUP_MINIO_ALIAS=catalog-minio
BACKUP_MINIO_BUCKET=catalog-photos-backup
```

---

## Task 2: Create `.gitignore`

- [ ] Create file `D:\Projetos\catalog-itens\.gitignore` with the following complete content:

```gitignore
# =============================================================================
# Catalog Itens — .gitignore
# =============================================================================

# -----------------------------------------------------------------------------
# Secrets — NEVER commit these
# -----------------------------------------------------------------------------
.env
*.env
.env.local
.env.*.local

# -----------------------------------------------------------------------------
# Java / Maven build artifacts
# -----------------------------------------------------------------------------
backend/target/
backend/.mvn/wrapper/maven-wrapper.jar
*.class
*.jar
*.war
*.ear
*.nar
hs_err_pid*
replay_pid*

# -----------------------------------------------------------------------------
# Node.js / Next.js
# -----------------------------------------------------------------------------
frontend/node_modules/
frontend/.next/
frontend/out/
frontend/.cache/
frontend/npm-debug.log*
frontend/yarn-debug.log*
frontend/yarn-error.log*
frontend/.npm

# -----------------------------------------------------------------------------
# Docker
# -----------------------------------------------------------------------------
# Local override files not committed
docker-compose.override.yml

# -----------------------------------------------------------------------------
# Backups generated by docker-compose.backup.yml
# -----------------------------------------------------------------------------
backups/

# -----------------------------------------------------------------------------
# IDE / Editor
# -----------------------------------------------------------------------------
.idea/
*.iml
*.iws
.vscode/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# -----------------------------------------------------------------------------
# Superpowers agent workspace
# -----------------------------------------------------------------------------
.superpowers/

# -----------------------------------------------------------------------------
# OS
# -----------------------------------------------------------------------------
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

---

## Task 3: Create `backend/Dockerfile`

- [ ] Create file `D:\Projetos\catalog-itens\backend\Dockerfile` with the following complete content:

```dockerfile
# =============================================================================
# Backend — Multi-stage Dockerfile
# Stages:
#   1. deps    — Download all Maven dependencies (cached layer)
#   2. build   — Compile + package the application JAR
#   3. runtime — Minimal JRE image with non-root user
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: deps
# Download all dependencies into the local repository so the build stage
# benefits from Docker layer cache even when source code changes.
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS deps

WORKDIR /build

# Copy only the POM first — this layer is rebuilt only when pom.xml changes
COPY pom.xml ./

# Download all dependencies (including plugins) offline
# The -B flag enables batch (non-interactive) mode for CI environments
RUN --mount=type=cache,target=/root/.m2 \
    ./mvnw --batch-mode dependency:go-offline -q || \
    (apt-get update -q && apt-get install -y -q wget && \
     wget -q https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz \
     && tar xzf apache-maven-3.9.6-bin.tar.gz -C /opt \
     && ln -s /opt/apache-maven-3.9.6/bin/mvn /usr/local/bin/mvn \
     && mvn --batch-mode dependency:go-offline -q)

# NOTE: If the project uses the Maven wrapper (mvnw), the COPY above must
# include the wrapper. The RUN below handles both mvnw and system mvn.
# The preferred approach is to use the wrapper bundled in the repo.

# -----------------------------------------------------------------------------
# Stage 2: build
# Compile the application and produce the executable JAR.
# Tests are skipped here; they should run in CI before building the image.
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /build

# Re-use the downloaded .m2 repository from the deps stage
COPY --from=deps /root/.m2 /root/.m2

# Copy the Maven wrapper and POM
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Copy all source code
COPY src/ src/

# Package the application — skip tests (run them in CI separately)
RUN --mount=type=cache,target=/root/.m2 \
    chmod +x mvnw && \
    ./mvnw --batch-mode package -DskipTests -q && \
    # Rename the JAR to a fixed name so the runtime stage is not version-dependent
    mv target/*.jar target/app.jar

# -----------------------------------------------------------------------------
# Stage 3: runtime
# Minimal JRE image — no JDK, no build tools, no shell utilities beyond
# what is needed for health checks. Runs as non-root user "spring".
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime

# Install curl for health check (wget is an alternative and already present
# on alpine, but curl is more reliable for HTTP checks)
RUN apk add --no-cache curl

# Create a non-root group and user
# UID/GID 1001 avoids conflicts with common system users
RUN addgroup -g 1001 -S spring && \
    adduser -u 1001 -S spring -G spring

WORKDIR /app

# Copy only the built JAR from the build stage
COPY --from=build --chown=spring:spring /build/target/app.jar ./app.jar

# Switch to the non-root user for all subsequent commands and at runtime
USER spring:spring

# Expose the Spring Boot HTTP port
EXPOSE 8080

# JVM flags:
#   -XX:+UseContainerSupport       — respect cgroup memory/CPU limits
#   -XX:MaxRAMPercentage=75.0      — use 75% of container memory as heap
#   -XX:+ExitOnOutOfMemoryError    — crash fast on OOM instead of degrading
# Additional flags can be passed via JAVA_TOOL_OPTIONS env var at runtime.
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Health check — polls Spring Boot Actuator /actuator/health
# start-period: 60s gives Flyway and Spring context time to fully start
# interval: 30s is frequent enough to detect failures quickly
# timeout: 5s prevents hanging checks from blocking container lifecycle
# retries: 3 means the container is marked unhealthy after 3 consecutive failures
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

---

## Task 4: Create `backend/.dockerignore`

- [ ] Create file `D:\Projetos\catalog-itens\backend\.dockerignore` with the following complete content:

```dockerignore
# =============================================================================
# backend/.dockerignore
# Prevents unnecessary files from being sent to the Docker build context.
# This dramatically reduces build times and avoids accidental secret leakage.
# =============================================================================

# Maven build output — rebuilt inside the container
target/

# IDE project files
.idea/
*.iml
.vscode/
*.swp
*.swo

# Git metadata
.git/
.gitignore

# Environment files — secrets must never enter the build context
.env
*.env

# Test reports and coverage data
**/surefire-reports/
**/failsafe-reports/
**/jacoco/

# Log files
*.log
logs/

# OS artifacts
.DS_Store
Thumbs.db

# Documentation
docs/
*.md

# Docker files themselves (not needed inside the image)
Dockerfile
.dockerignore
```

---

## Task 5: Create `frontend/Dockerfile`

- [ ] Create file `D:\Projetos\catalog-itens\frontend\Dockerfile` with the following complete content:

```dockerfile
# =============================================================================
# Frontend — Multi-stage Dockerfile
# Stages:
#   1. base    — Common Alpine Node base with libc compatibility shim
#   2. deps    — Install all npm dependencies (cached layer)
#   3. builder — Run next build, produce standalone output
#   4. runner  — Minimal runtime with only the standalone output
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: base
# Pins the exact Node version. libc6-compat is required on Alpine for
# certain native binaries (e.g. SWC compiler used by Next.js).
# -----------------------------------------------------------------------------
FROM node:22-alpine AS base

RUN apk add --no-cache libc6-compat curl

# -----------------------------------------------------------------------------
# Stage 2: deps
# Install all dependencies with npm ci for a clean, reproducible install.
# Only package.json and package-lock.json are copied at this stage so that
# this layer is only invalidated when dependencies actually change.
# -----------------------------------------------------------------------------
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# npm ci installs exact versions from package-lock.json — no surprises
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 3: builder
# Build the production Next.js application.
# output: 'standalone' in next.config.ts is REQUIRED — it produces a minimal
# self-contained server bundle that does not need node_modules at runtime.
# -----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree
COPY . .

# Set NEXT_TELEMETRY_DISABLED to avoid outbound network calls during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 4: runner
# Minimal runtime image. Only the standalone output, public assets, and static
# files are copied. No node_modules, no source code, no build tooling.
# Runs as non-root user "nextjs" (UID/GID 1001).
# -----------------------------------------------------------------------------
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# Copy static assets from the build stage
# public/ — user-facing static files (icons, images, manifests)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy the standalone server bundle
# The standalone directory contains server.js and its minimal dependencies
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy pre-rendered static pages and assets from the Next.js build cache
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs:nodejs

EXPOSE 3000

# Health check — polls the /api/health route defined in src/app/api/health/route.ts
# start-period: 15s is sufficient for Next.js standalone server startup
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Run the standalone server entry point
CMD ["node", "server.js"]
```

---

## Task 6: Create `frontend/.dockerignore`

- [ ] Create file `D:\Projetos\catalog-itens\frontend\.dockerignore` with the following complete content:

```dockerignore
# =============================================================================
# frontend/.dockerignore
# Prevents unnecessary files from being sent to the Docker build context.
# =============================================================================

# Next.js build output — rebuilt inside the container
.next/

# Dependencies — reinstalled inside the container via npm ci
node_modules/

# Environment files — secrets must not enter the build context
.env
*.env
.env.local
.env.*.local

# Git metadata
.git/
.gitignore

# IDE project files
.idea/
.vscode/
*.swp
*.swo

# Test artifacts
coverage/
playwright-report/
test-results/

# Log files
*.log
logs/
npm-debug.log*

# OS artifacts
.DS_Store
Thumbs.db

# Documentation
*.md
docs/

# Docker files themselves
Dockerfile
.dockerignore

# TypeScript build info (rebuilt inside container)
*.tsbuildinfo
```

---

## Task 7: Create the frontend health check API route

- [ ] Create file `D:\Projetos\catalog-itens\frontend\src\app\api\health\route.ts` with the following complete content:

```typescript
import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Lightweight health check endpoint consumed by the Docker HEALTHCHECK
 * directive in the frontend Dockerfile. Returns HTTP 200 with a JSON body
 * when the Next.js server is ready to handle requests.
 *
 * This endpoint is intentionally minimal — it does NOT call the backend or
 * any database. Its sole purpose is to confirm that the Node.js HTTP server
 * is alive and routing requests correctly.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { status: "ok" },
    {
      status: 200,
      headers: {
        // Prevent any caching layer from serving a stale "ok" response
        "Cache-Control": "no-store",
      },
    }
  );
}
```

---

## Task 8: Create `docker-compose.yml` (base)

- [ ] Create file `D:\Projetos\catalog-itens\docker-compose.yml` with the following complete content:

```yaml
# =============================================================================
# docker-compose.yml — Base Compose file
#
# Defines all 5 services, 3 networks, and 2 named volumes.
# This file alone is NOT meant to be used directly in production or
# development; use the appropriate override:
#
#   Development : docker compose -f docker-compose.yml -f docker-compose.dev.yml up
#   Production  : docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
#   Backup      : docker compose -f docker-compose.backup.yml up
#
# Network topology:
#   frontend-net  — public-facing: frontend only
#   app-net       — service bus:   frontend ↔ backend ↔ minio
#   db-net        — isolated:      backend ↔ db (internal: true, no external routing)
# =============================================================================

services:

  # ---------------------------------------------------------------------------
  # frontend — Next.js 15 standalone server
  # ---------------------------------------------------------------------------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      # Pass build-time args that do NOT contain secrets
      args:
        NEXT_TELEMETRY_DISABLED: "1"
    image: catalog-itens/frontend:latest
    container_name: catalog-frontend
    # Port 3000 is the only port exposed to the host in production.
    # In dev the override file adds more ports.
    ports:
      - "3000:3000"   # host:container — Next.js HTTP
    environment:
      NODE_ENV: production
      # Server-side API URL (RSC / Server Actions call backend directly)
      API_URL: http://backend:8080
      # Client-side API URL (browser JS is proxied through Next.js route handlers)
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
    networks:
      - frontend-net
      - app-net
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      start_period: 15s
      retries: 3
    restart: unless-stopped

  # ---------------------------------------------------------------------------
  # backend — Spring Boot 3.4 / Java 21
  # ---------------------------------------------------------------------------
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: catalog-itens/backend:latest
    container_name: catalog-backend
    # Backend port is NOT mapped to the host in production (only accessible
    # via app-net). The dev override exposes it for local debugging.
    expose:
      - "8080"
    environment:
      SPRING_PROFILES_ACTIVE: ${SPRING_PROFILES_ACTIVE:-prod}
      # Database connection
      SPRING_DATASOURCE_URL: ${SPRING_DATASOURCE_URL:-jdbc:postgresql://db:5432/catalog_itens?TimeZone=UTC}
      SPRING_DATASOURCE_USERNAME: ${SPRING_DATASOURCE_USERNAME:-catalog}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      # HikariCP
      SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE: ${SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE:-2}
      SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE: ${SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE:-10}
      SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT: ${SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT:-30000}
      SPRING_DATASOURCE_HIKARI_MAX_LIFETIME: ${SPRING_DATASOURCE_HIKARI_MAX_LIFETIME:-1800000}
      # MinIO
      MINIO_ENDPOINT: ${MINIO_ENDPOINT:-http://minio:9000}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET: ${MINIO_BUCKET:-catalog-photos}
      # File upload limits
      SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE: ${SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE:-5MB}
      SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE: ${SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE:-15MB}
      # Presigned URL TTL
      APP_STORAGE_MINIO_PRESIGNED_URL_TTL: ${APP_STORAGE_MINIO_PRESIGNED_URL_TTL:-60}
      # JVM container support flags
      JAVA_TOOL_OPTIONS: >-
        -XX:+UseContainerSupport
        -XX:MaxRAMPercentage=75.0
        -XX:+ExitOnOutOfMemoryError
    networks:
      - app-net
      - db-net
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 5s
      start_period: 60s
      retries: 3
    restart: unless-stopped

  # ---------------------------------------------------------------------------
  # db — PostgreSQL 16
  # ---------------------------------------------------------------------------
  db:
    image: postgres:16-alpine
    container_name: catalog-db
    # DB port is NOT mapped to the host in production.
    # The dev override maps it for direct local access (e.g. DBeaver).
    expose:
      - "5432"
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-catalog_itens}
      POSTGRES_USER: ${POSTGRES_USER:-catalog}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      # Performance tuning applied at container startup via POSTGRES_INITDB_ARGS
      # and overridden via command-line flags below
      PGDATA: /var/lib/postgresql/data/pgdata
    command:
      - postgres
      - -c
      - shared_buffers=128MB
      - -c
      - work_mem=4MB
      - -c
      - idle_in_transaction_session_timeout=30000
      - -c
      - statement_timeout=10000
      - -c
      - log_min_duration_statement=1000
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - db-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-catalog} -d ${POSTGRES_DB:-catalog_itens}"]
      interval: 10s
      timeout: 5s
      start_period: 20s
      retries: 5
    restart: unless-stopped

  # ---------------------------------------------------------------------------
  # minio — MinIO object storage (S3-compatible)
  # Console is only enabled in dev (port 9001). In production only the
  # S3 API port (9000) is reachable, and only from within app-net.
  # ---------------------------------------------------------------------------
  minio:
    image: minio/minio:RELEASE.2024-11-07T00-52-20Z
    container_name: catalog-minio
    expose:
      - "9000"   # S3 API — internal only
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data
    networks:
      - app-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 5s
      start_period: 20s
      retries: 3
    restart: unless-stopped

  # ---------------------------------------------------------------------------
  # minio-init — One-shot service that bootstraps the MinIO bucket and
  # service account on first startup.
  #
  # Actions performed:
  #   1. Wait for MinIO to be healthy (retry loop)
  #   2. Configure the mc alias pointing to the MinIO S3 endpoint
  #   3. Create the catalog-photos bucket if it does not already exist
  #   4. Set the bucket policy to private (deny anonymous access)
  #   5. Create a service account for the backend with limited permissions
  #
  # This container exits with code 0 on success. Compose dependency
  # condition: service_completed_successfully ensures the backend waits.
  # ---------------------------------------------------------------------------
  minio-init:
    image: minio/mc:RELEASE.2024-11-17T19-35-25Z
    container_name: catalog-minio-init
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET: ${MINIO_BUCKET:-catalog-photos}
    networks:
      - app-net
    depends_on:
      minio:
        condition: service_healthy
    # The entrypoint script:
    #   - Sets the MinIO alias using root credentials
    #   - Creates the bucket (--ignore-existing prevents errors on re-run)
    #   - Sets anonymous access to "none" (private bucket)
    #   - Creates the service account used by the backend
    #   - Creates a thumbs/ prefix with the same service account access
    entrypoint: >
      /bin/sh -c "
        echo 'Configuring mc alias...' &&
        mc alias set catalog http://minio:9000 $${MINIO_ROOT_USER} $${MINIO_ROOT_PASSWORD} &&

        echo 'Creating bucket...' &&
        mc mb --ignore-existing catalog/$${MINIO_BUCKET} &&

        echo 'Setting bucket to private (deny anonymous)...' &&
        mc anonymous set none catalog/$${MINIO_BUCKET} &&

        echo 'Creating service account...' &&
        mc admin user svcacct add \
          --access-key $${MINIO_ACCESS_KEY} \
          --secret-key $${MINIO_SECRET_KEY} \
          catalog $${MINIO_ROOT_USER} || true &&

        echo 'minio-init completed successfully.'
      "
    restart: "no"

# =============================================================================
# Named volumes — data is persisted across container restarts
# =============================================================================
volumes:
  postgres_data:
    driver: local
  minio_data:
    driver: local

# =============================================================================
# Networks
# =============================================================================
networks:
  # Public-facing network — only the frontend container joins this.
  # In a real multi-host setup this would be an overlay network.
  frontend-net:
    driver: bridge

  # Internal application bus — frontend, backend, and minio communicate here.
  app-net:
    driver: bridge

  # Isolated database network — only backend and db join this.
  # internal: true means no container on this network can reach the internet.
  db-net:
    driver: bridge
    internal: true
```

---

## Task 9: Create `docker-compose.dev.yml`

- [ ] Create file `D:\Projetos\catalog-itens\docker-compose.dev.yml` with the following complete content:

```yaml
# =============================================================================
# docker-compose.dev.yml — Development override
#
# Usage:
#   docker compose -f docker-compose.yml -f docker-compose.dev.yml up
#
# What this adds vs the base file:
#   - Exposes backend port 8080 to the host for direct API testing
#   - Exposes db port 5432 to the host for GUI DB clients (DBeaver, TablePlus)
#   - Exposes MinIO console port 9001 to the host for bucket management
#   - Bind mounts for hot reload (backend and frontend source code)
#   - Sets SPRING_PROFILES_ACTIVE=dev to load application-dev.yml
#   - Enables Compose Watch on frontend for file sync without full rebuild
#   - Disables restart policies so failed containers stay stopped for inspection
# =============================================================================

services:

  # ---------------------------------------------------------------------------
  # frontend — Development overrides
  # ---------------------------------------------------------------------------
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      # In dev we still build the image but Compose Watch syncs changes.
      # The target can be overridden to a lighter stage if preferred.
      target: runner
    environment:
      NODE_ENV: development
      API_URL: http://backend:8080
      NEXT_PUBLIC_API_URL: http://localhost:3000/api
    # Compose Watch — syncs source changes into the running container
    # without requiring a full image rebuild.
    develop:
      watch:
        # Sync source files directly into the container
        - action: sync
          path: ./frontend/src
          target: /app/src
          ignore:
            - node_modules/
        # Sync public static assets
        - action: sync
          path: ./frontend/public
          target: /app/public
        # Rebuild the image when package.json or package-lock.json change
        - action: rebuild
          path: ./frontend/package.json
        - action: rebuild
          path: ./frontend/package-lock.json
        # Rebuild when Next.js config changes
        - action: rebuild
          path: ./frontend/next.config.ts
        # Rebuild when Tailwind config changes (affects CSS output)
        - action: rebuild
          path: ./frontend/tailwind.config.ts
    restart: "no"

  # ---------------------------------------------------------------------------
  # backend — Development overrides
  # ---------------------------------------------------------------------------
  backend:
    environment:
      # Load the development Spring profile (application-dev.yml)
      # This typically enables debug logging, SQL logging, and relaxed CORS
      SPRING_PROFILES_ACTIVE: dev
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/catalog_itens?TimeZone=UTC
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER:-catalog}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      MINIO_ENDPOINT: http://minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY}
      MINIO_BUCKET: ${MINIO_BUCKET:-catalog-photos}
      # In dev, increase log verbosity via JVM system properties
      JAVA_TOOL_OPTIONS: >-
        -XX:+UseContainerSupport
        -XX:MaxRAMPercentage=75.0
        -XX:+ExitOnOutOfMemoryError
        -Dlogging.level.org.hibernate.SQL=DEBUG
        -Dlogging.level.org.hibernate.orm.jdbc.bind=TRACE
    ports:
      # Expose backend for direct API calls from host (curl, Postman, IntelliJ HTTP client)
      - "8080:8080"   # host:container — Spring Boot HTTP
    restart: "no"

  # ---------------------------------------------------------------------------
  # db — Development overrides
  # ---------------------------------------------------------------------------
  db:
    ports:
      # Expose PostgreSQL to the host for GUI clients
      - "5432:5432"   # host:container — PostgreSQL
    restart: "no"

  # ---------------------------------------------------------------------------
  # minio — Development overrides
  # ---------------------------------------------------------------------------
  minio:
    ports:
      # S3 API — exposed for direct access from host tools (aws CLI, mc)
      - "9000:9000"   # host:container — MinIO S3 API
      # MinIO web console — management UI
      - "9001:9001"   # host:container — MinIO Console
    restart: "no"
```

---

## Task 10: Create `docker-compose.prod.yml`

- [ ] Create file `D:\Projetos\catalog-itens\docker-compose.prod.yml` with the following complete content:

```yaml
# =============================================================================
# docker-compose.prod.yml — Production hardening override
#
# Usage:
#   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
#
# What this adds vs the base file:
#   - Resource limits (memory + CPU) per container
#   - restart: unless-stopped for all services
#   - json-file log driver with rotation (max-size 50m, max-file 5)
#   - read_only root filesystem + tmpfs for writable directories
#   - cap_drop: ALL (drop all Linux capabilities)
#   - no-new-privileges: true (prevents privilege escalation)
#   - PostgreSQL performance tuning command flags
# =============================================================================

services:

  # ---------------------------------------------------------------------------
  # frontend — Production hardening
  # ---------------------------------------------------------------------------
  frontend:
    environment:
      NODE_ENV: production
    deploy:
      resources:
        limits:
          # 256MB RAM, 0.5 CPU cores — Next.js standalone is lightweight
          memory: 256M
          cpus: "0.50"
        reservations:
          memory: 128M
          cpus: "0.25"
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    # Read-only root filesystem hardens the container against runtime tampering.
    # Next.js standalone server only needs to write to /tmp.
    read_only: true
    tmpfs:
      - /tmp:mode=1777,size=64m
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL

  # ---------------------------------------------------------------------------
  # backend — Production hardening
  # ---------------------------------------------------------------------------
  backend:
    environment:
      SPRING_PROFILES_ACTIVE: prod
    deploy:
      resources:
        limits:
          # 768MB RAM — JVM MaxRAMPercentage=75 gives ~576MB heap
          # 1 CPU core — Spring Boot is well-suited to single-core deployments
          memory: 768M
          cpus: "1.00"
        reservations:
          memory: 384M
          cpus: "0.50"
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    # Spring Boot writes nothing to the filesystem at runtime beyond /tmp.
    # Temporary files (multipart uploads) are written to the JVM temp dir.
    read_only: true
    tmpfs:
      # Spring Boot multipart upload staging area
      - /tmp:mode=1777,size=128m
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL

  # ---------------------------------------------------------------------------
  # db — Production hardening
  # ---------------------------------------------------------------------------
  db:
    deploy:
      resources:
        limits:
          # 512MB RAM, 0.5 CPU — PostgreSQL with shared_buffers=128MB
          memory: 512M
          cpus: "0.50"
        reservations:
          memory: 256M
          cpus: "0.25"
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    # PostgreSQL needs to write to its data directory and a few system paths.
    # The data volume is mounted read-write; /tmp and /run/postgresql are tmpfs.
    tmpfs:
      - /tmp:mode=1777,size=64m
      - /run/postgresql:mode=0755,size=16m

  # ---------------------------------------------------------------------------
  # minio — Production hardening
  # ---------------------------------------------------------------------------
  minio:
    deploy:
      resources:
        limits:
          # 256MB RAM, 0.5 CPU — MinIO is efficient for single-node deployments
          memory: 256M
          cpus: "0.50"
        reservations:
          memory: 128M
          cpus: "0.25"
    restart: unless-stopped
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    # MinIO writes data to its mounted volume (/data). It also needs /tmp.
    tmpfs:
      - /tmp:mode=1777,size=64m

  # ---------------------------------------------------------------------------
  # minio-init — Production hardening
  # ---------------------------------------------------------------------------
  minio-init:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "2"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
```

---

## Task 11: Create `docker-compose.backup.yml`

- [ ] Create file `D:\Projetos\catalog-itens\docker-compose.backup.yml` with the following complete content:

```yaml
# =============================================================================
# docker-compose.backup.yml — Backup services
#
# Usage (run manually or via cron):
#   docker compose -f docker-compose.backup.yml --env-file .env up --abort-on-container-exit
#
# What this does:
#   1. pg-backup: runs pg_dump against the running db container, writes a
#      timestamped compressed SQL dump to ./backups/postgres/
#   2. minio-backup: runs mc mirror to sync the catalog-photos bucket to a
#      local ./backups/minio/ directory.
#
# Retention: files older than 7 days are deleted automatically.
#
# Prerequisites:
#   - The base stack (docker-compose.yml) must be running.
#   - The ./backups directory will be created automatically.
#   - Both services exit with code 0 on success; inspect logs on failure.
#
# Cron example (run daily at 2:00 AM):
#   0 2 * * * cd /opt/catalog-itens && \
#     docker compose -f docker-compose.backup.yml --env-file .env \
#     up --abort-on-container-exit >> /var/log/catalog-backup.log 2>&1
# =============================================================================

services:

  # ---------------------------------------------------------------------------
  # pg-backup — PostgreSQL dump via pg_dump
  # Connects to the running db container over the db-net network.
  # Output: ./backups/postgres/catalog_itens_YYYY-MM-DD_HH-MM-SS.sql.gz
  # Retention: deletes .sql.gz files older than 7 days.
  # ---------------------------------------------------------------------------
  pg-backup:
    image: postgres:16-alpine
    container_name: catalog-pg-backup
    environment:
      PGHOST: db
      PGPORT: "5432"
      PGDATABASE: ${POSTGRES_DB:-catalog_itens}
      PGUSER: ${POSTGRES_USER:-catalog}
      PGPASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      # Mount the host backup directory into the container
      - ${BACKUP_DIR:-./backups}/postgres:/backups
    networks:
      # Must share db-net with the running db service to reach it
      - db-net
    command: >
      /bin/sh -c "
        set -e &&
        mkdir -p /backups &&
        TIMESTAMP=$$(date +%Y-%m-%d_%H-%M-%S) &&
        FILENAME=catalog_itens_$${TIMESTAMP}.sql.gz &&
        echo 'Starting pg_dump to /backups/'$${FILENAME}'...' &&
        pg_dump \
          --no-password \
          --format=plain \
          --no-owner \
          --no-acl \
          --encoding=UTF8 \
          | gzip -9 > /backups/$${FILENAME} &&
        echo 'Dump completed: '/backups/$${FILENAME} &&
        echo 'Applying 7-day retention policy...' &&
        find /backups -name '*.sql.gz' -mtime +7 -delete &&
        echo 'Retention cleanup done.' &&
        echo 'pg-backup finished successfully.'
      "
    restart: "no"

  # ---------------------------------------------------------------------------
  # minio-backup — MinIO mirror via mc
  # Mirrors the catalog-photos bucket to a local directory.
  # Output: ./backups/minio/catalog-photos/ (full mirror)
  # Retention: deletes files older than 7 days from the mirror directory.
  # ---------------------------------------------------------------------------
  minio-backup:
    image: minio/mc:RELEASE.2024-11-17T19-35-25Z
    container_name: catalog-minio-backup
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
      MINIO_BUCKET: ${MINIO_BUCKET:-catalog-photos}
    volumes:
      # Mount the host backup directory into the container
      - ${BACKUP_DIR:-./backups}/minio:/backups
    networks:
      # Must share app-net with the running minio service to reach it
      - app-net
    command: >
      /bin/sh -c "
        set -e &&
        mkdir -p /backups &&
        echo 'Configuring mc alias...' &&
        mc alias set catalog http://minio:9000 $${MINIO_ROOT_USER} $${MINIO_ROOT_PASSWORD} &&
        echo 'Starting mirror of bucket '$${MINIO_BUCKET}'...' &&
        mc mirror --overwrite --remove \
          catalog/$${MINIO_BUCKET} \
          /backups/$${MINIO_BUCKET} &&
        echo 'Mirror completed.' &&
        echo 'Applying 7-day retention policy to local mirror...' &&
        find /backups/$${MINIO_BUCKET} -type f -mtime +7 -delete &&
        echo 'Retention cleanup done.' &&
        echo 'minio-backup finished successfully.'
      "
    restart: "no"

# =============================================================================
# Networks — must reference the same networks as the base compose file
# so backup containers can reach db and minio
# =============================================================================
networks:
  db-net:
    external: true
    name: catalog-itens_db-net
  app-net:
    external: true
    name: catalog-itens_app-net
```

---

## Task 12: Smoke test — verify the stack is healthy

- [ ] Ensure you have a `.env` file at `D:\Projetos\catalog-itens\.env` with real secrets (copy from `.env.example` and fill in values). For local smoke testing use the following minimum viable values:

```bash
POSTGRES_PASSWORD=localtest123
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_ACCESS_KEY=catalog-service
MINIO_SECRET_KEY=catalogsecret123
```

- [ ] **Step 12.1 — Start the stack in development mode**

Run this command from `D:\Projetos\catalog-itens\`:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

Expected output (order may vary):
```
[+] Building ...
 => [backend] ...
 => [frontend] ...
[+] Running 5/5
 ✔ Container catalog-db          Started
 ✔ Container catalog-minio       Started
 ✔ Container catalog-minio-init  Started
 ✔ Container catalog-backend     Started
 ✔ Container catalog-frontend    Started
```

- [ ] **Step 12.2 — Wait for health checks to pass**

Run:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Expected output (all services must show `healthy`):
```
NAME                   IMAGE                        COMMAND                  SERVICE      CREATED         STATUS                    PORTS
catalog-backend        catalog-itens/backend:latest "java -jar /app/app.…"  backend      X seconds ago   Up X seconds (healthy)    0.0.0.0:8080->8080/tcp
catalog-db             postgres:16-alpine           "docker-entrypoint.s…"  db           X seconds ago   Up X seconds (healthy)    0.0.0.0:5432->5432/tcp
catalog-frontend       catalog-itens/frontend:late… "node server.js"         frontend     X seconds ago   Up X seconds (healthy)    0.0.0.0:3000->3000/tcp
catalog-minio          minio/minio:RELEASE.2024-1…  "/usr/bin/docker-ent…"  minio        X seconds ago   Up X seconds (healthy)    0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
catalog-minio-init     minio/mc:RELEASE.2024-11-1…  "/bin/sh -c ..."        minio-init   X seconds ago   Exited (0)
```

If any container is not healthy after 2 minutes, inspect logs:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs db
```

- [ ] **Step 12.3 — Test frontend health endpoint**

Run:
```bash
curl -s http://localhost:3000/api/health
```

Expected output:
```json
{"status":"ok"}
```

- [ ] **Step 12.4 — Test backend Actuator health**

Run:
```bash
curl -s http://localhost:8080/actuator/health
```

Expected output (Spring Boot reports UP when DB and MinIO are reachable):
```json
{"status":"UP"}
```

- [ ] **Step 12.5 — Test a REST API call (list rooms)**

Run:
```bash
curl -s -X GET http://localhost:8080/api/rooms \
  -H "Accept: application/json"
```

Expected output (empty array on fresh install):
```json
[]
```

- [ ] **Step 12.6 — Test photo upload flow**

First, create a room:
```bash
curl -s -X POST http://localhost:8080/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name": "Sala de Estar", "description": "Sala principal"}' | tee /tmp/room.json
```

Expected output (UUID will differ):
```json
{"id":"019500c0-1234-7abc-8def-000000000001","name":"Sala de Estar","description":"Sala principal","createdAt":"2026-04-04T12:00:00Z","updatedAt":"2026-04-04T12:00:00Z"}
```

Extract the room ID and upload a test photo (requires a JPEG or PNG file):
```bash
ROOM_ID=$(cat /tmp/room.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
curl -s -X POST http://localhost:8080/api/rooms/${ROOM_ID}/photos \
  -F "file=@/path/to/test-image.jpg;type=image/jpeg"
```

Expected output:
```json
{"id":"...","entityType":"room","entityId":"...","originalFilename":"test-image.jpg","contentType":"image/jpeg","fileSize":12345,"sortOrder":0,"presignedUrl":"http://localhost:9000/catalog-photos/photos/room/...?X-Amz-...","createdAt":"..."}
```

- [ ] **Step 12.7 — Verify MinIO bucket was created**

Run:
```bash
docker exec catalog-minio-init mc ls catalog/
```

Or using the installed mc from the minio-init container:
```bash
docker run --rm --network catalog-itens_app-net \
  -e MC_HOST_catalog=http://minioadmin:minioadmin123@minio:9000 \
  minio/mc:RELEASE.2024-11-17T19-35-25Z \
  ls catalog/
```

Expected output:
```
[YYYY-MM-DD HH:MM:SS UTC]     0B catalog-photos/
```

- [ ] **Step 12.8 — Stop the stack**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Expected output:
```
[+] Running 6/6
 ✔ Container catalog-frontend    Removed
 ✔ Container catalog-backend     Removed
 ✔ Container catalog-minio-init  Removed
 ✔ Container catalog-minio       Removed
 ✔ Container catalog-db          Removed
 ✔ Network catalog-itens_...     Removed
```

---

## Task 13: Create `README.md`

- [ ] Create file `D:\Projetos\catalog-itens\README.md` with the following complete content:

```markdown
# Catalog Itens

Aplicação web responsiva (PWA) para catalogar itens da casa, organizados por cômodos e locais de armazenamento. Tema visual Barbie.

## Stack

| Layer    | Technology                           |
|----------|--------------------------------------|
| Frontend | Next.js 15, React 19, Tailwind CSS   |
| Backend  | Spring Boot 3.4, Java 21             |
| Database | PostgreSQL 16                        |
| Storage  | MinIO (S3-compatible)                |
| Deploy   | Docker Compose                       |

## Prerequisites

- Docker Engine 25.0+ with BuildKit enabled (default since Docker 23)
- Docker Compose plugin v2.24+ (ships with Docker Desktop)
- `curl` (for smoke tests)
- 2GB free RAM minimum (4GB recommended)

Verify versions:
```bash
docker --version
docker compose version
```

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/your-user/catalog-itens.git
cd catalog-itens
cp .env.example .env
```

Edit `.env` and replace all `changeme_*` values with strong random secrets:

```bash
# Generate strong passwords
openssl rand -base64 32   # use output for POSTGRES_PASSWORD
openssl rand -base64 32   # use output for MINIO_ROOT_PASSWORD
openssl rand -base64 32   # use output for MINIO_SECRET_KEY
```

### 2. Development mode

Development mode exposes all ports to the host and enables hot reload via Compose Watch.

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Services available:
- Frontend:       http://localhost:3000
- Backend API:    http://localhost:8080/api
- Actuator:       http://localhost:8080/actuator/health
- MinIO Console:  http://localhost:9001  (user: value of MINIO_ROOT_USER)
- PostgreSQL:     localhost:5432         (connect with any GUI client)

With Compose Watch active, changes to `frontend/src/` are synced automatically.
Changes to `package.json` or `next.config.ts` trigger a full image rebuild.

### 3. Production mode

Production mode applies resource limits, security hardening (read-only filesystem,
capability drops), log rotation, and does not expose backend, db, or MinIO ports.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Only port 3000 is published to the host. Use a reverse proxy (nginx, Caddy, Traefik)
in front of it for TLS termination.

Check health:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

View logs:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
```

Stop:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Backup and Restore

### Run backup

The backup stack runs pg_dump and mc mirror as one-shot containers, then exits.
Data is written to `./backups/postgres/` and `./backups/minio/`.

```bash
docker compose -f docker-compose.backup.yml --env-file .env up --abort-on-container-exit
```

Files older than 7 days are deleted automatically by the backup containers.

### Schedule automatic backups (Linux cron)

```bash
crontab -e
```

Add:
```
0 2 * * * cd /opt/catalog-itens && docker compose -f docker-compose.backup.yml --env-file .env up --abort-on-container-exit >> /var/log/catalog-backup.log 2>&1
```

### Restore PostgreSQL

```bash
# Stop the backend to avoid conflicts
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend

# Restore from a specific dump file
DUMP_FILE=./backups/postgres/catalog_itens_2026-04-04_02-00-00.sql.gz
docker run --rm \
  --network catalog-itens_db-net \
  -v $(pwd)/backups/postgres:/backups \
  -e PGPASSWORD=${POSTGRES_PASSWORD} \
  postgres:16-alpine \
  bash -c "gunzip -c /backups/$(basename $DUMP_FILE) | psql -h db -U catalog -d catalog_itens"

# Restart the backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml start backend
```

### Restore MinIO

The mc mirror backup produces a local directory that mirrors the bucket.
To restore, mirror it back to MinIO:

```bash
docker run --rm \
  --network catalog-itens_app-net \
  -v $(pwd)/backups/minio:/backups \
  -e MC_HOST_catalog=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@minio:9000 \
  minio/mc:RELEASE.2024-11-17T19-35-25Z \
  mirror --overwrite /backups/catalog-photos catalog/catalog-photos
```

## Project Structure

```
catalog-itens/
├── backend/
│   ├── src/
│   ├── Dockerfile         # Multi-stage: deps → build → runtime
│   ├── .dockerignore
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   └── app/api/health/route.ts   # Docker health check endpoint
│   ├── Dockerfile         # Multi-stage: base → deps → builder → runner
│   ├── .dockerignore
│   └── package.json
├── docker-compose.yml         # Base: services, networks, volumes
├── docker-compose.dev.yml     # Dev: exposed ports, hot reload, debug logging
├── docker-compose.prod.yml    # Prod: resource limits, hardening, log rotation
├── docker-compose.backup.yml  # Backup: pg_dump + mc mirror one-shot services
├── .env.example               # Template — copy to .env and fill secrets
├── .gitignore
└── README.md
```

## Network Architecture

```
Host
 └── :3000 ──► frontend (frontend-net + app-net)
                  └──► backend :8080 (app-net + db-net)
                         ├──► db :5432 (db-net — internal, no internet)
                         └──► minio :9000 (app-net)
```

Only port 3000 is reachable from outside Docker in production.
db-net is declared `internal: true` — containers on it cannot reach the internet.

## Health Check Summary

| Service    | Endpoint                          | Interval | Start Period |
|------------|-----------------------------------|----------|--------------|
| frontend   | GET /api/health                   | 30s      | 15s          |
| backend    | GET /actuator/health              | 30s      | 60s          |
| db         | pg_isready                        | 10s      | 20s          |
| minio      | GET /minio/health/live            | 30s      | 20s          |

## Troubleshooting

**Backend takes more than 60 seconds to start:**
Flyway runs all migrations on first startup. This is normal. The health check
`start-period: 60s` accounts for this. Check logs with:
```bash
docker compose logs backend
```

**minio-init exits with non-zero code:**
The service account creation may fail if the account already exists (re-run scenario).
This is handled by the `|| true` in the entrypoint. Check logs:
```bash
docker compose logs minio-init
```

**Frontend HEALTHCHECK fails:**
Ensure `src/app/api/health/route.ts` exists and `next.config.ts` sets `output: 'standalone'`.
The standalone build is required for the Docker runner stage to work correctly.

**Out of memory errors:**
Increase the memory limits in `docker-compose.prod.yml` or reduce `MaxRAMPercentage`
in `JAVA_TOOL_OPTIONS` for the backend service.

**Port conflicts:**
If ports 3000, 5432, 8080, or 9000/9001 are in use on the host, either:
- Change the host-side port in `docker-compose.dev.yml` (e.g. `"18080:8080"`)
- Stop the conflicting local service before starting the stack
```
```

---

## Summary of Files Created

| File | Purpose |
|------|---------|
| `D:\Projetos\catalog-itens\.env.example` | All environment variables with safe defaults and placeholders for secrets |
| `D:\Projetos\catalog-itens\.gitignore` | Excludes .env, build artifacts, IDE files, .superpowers/ |
| `D:\Projetos\catalog-itens\backend\Dockerfile` | Multi-stage: deps (mvn dependency:go-offline) → build (mvn package) → runtime (eclipse-temurin:21-jre-alpine, non-root, HEALTHCHECK) |
| `D:\Projetos\catalog-itens\backend\.dockerignore` | Excludes target/, .env, IDE files, docs from build context |
| `D:\Projetos\catalog-itens\frontend\Dockerfile` | Multi-stage: base (node:22-alpine) → deps (npm ci) → builder (npm run build) → runner (standalone, non-root nextjs, HEALTHCHECK) |
| `D:\Projetos\catalog-itens\frontend\.dockerignore` | Excludes .next/, node_modules/, .env, test artifacts from build context |
| `D:\Projetos\catalog-itens\frontend\src\app\api\health\route.ts` | Returns `{"status":"ok"}` for Docker HEALTHCHECK |
| `D:\Projetos\catalog-itens\docker-compose.yml` | Base: all 5 services, 3 networks (frontend-net, app-net, db-net internal:true), 2 named volumes, health checks, depends_on conditions, minio-init one-shot |
| `D:\Projetos\catalog-itens\docker-compose.dev.yml` | Dev: exposes 8080, 5432, 9000, 9001; Compose Watch on frontend; SPRING_PROFILES_ACTIVE=dev; restart:no |
| `D:\Projetos\catalog-itens\docker-compose.prod.yml` | Prod: resource limits (backend 768M/1CPU, frontend 256M/0.5CPU, db 512M/0.5CPU, minio 256M/0.5CPU), json-file logging, read_only+tmpfs, cap_drop:ALL, no-new-privileges:true |
| `D:\Projetos\catalog-itens\docker-compose.backup.yml` | Backup: pg_dump (7-day retention) + mc mirror (7-day retention), external network references |
| `D:\Projetos\catalog-itens\README.md` | Prerequisites, quick start, dev/prod mode, backup/restore, network diagram, health check table, troubleshooting |
