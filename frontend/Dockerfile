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
