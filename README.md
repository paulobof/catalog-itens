# SakaBof Catálogo

[![Status](https://img.shields.io/badge/Status-Em%20Produção-brightgreen?style=flat-square)](https://catalogo.paulobof.com.br)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](docker-compose.yml)

Aplicação web pessoal para catalogar itens da casa organizados em **cômodo → local → produto**, com fotos, tags e busca. Interface mobile-first com tema rosa/Barbie.

**Produção:** [catalogo.paulobof.com.br](https://catalogo.paulobof.com.br)

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Stack Técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Autenticação](#autenticação)
- [Início Rápido](#início-rápido)
- [Desenvolvimento](#desenvolvimento)
- [Endpoints da API](#endpoints-da-api)
- [Observabilidade](#observabilidade)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## Funcionalidades

- **Hierarquia Cômodo → Local → Produto** — navegação drill-down em catálogo único
- **Catálogo SPA com URL stateful** — `?room=X&location=Y` permite back/forward do browser
- **Upload de fotos** com até 3 imagens por entidade (cômodo, local ou produto)
  - Tirar foto direto pela câmera (mobile) ou escolher do dispositivo
  - Re-encode automático para JPEG, strip EXIF, max 2048px
  - Geração assíncrona de thumbnails
  - Drag & drop para reordenar slots
- **Busca full-text** em produtos via PostgreSQL `tsvector` + trigram
- **Filtro de busca client-side** em cada nível do catálogo
- **Tags coloridas** para categorizar produtos
- **CRUD completo** para cômodos, locais, produtos, tags e fotos
- **Botões de editar/excluir** em todos os cards do catálogo
- **Botão flutuante contextual (FAB)** que cria a entidade do nível atual
- **Soft-delete** com cascade automático (apaga local → apaga fotos do local)
- **Tema Barbie** (rosa/pink) responsivo e mobile-first
- **PWA instalável** com ícone próprio
- **Autenticação** com 2 usuários fixos no banco (sem cadastro público)

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | Next.js (App Router) | 15.3 |
| | React | 19 |
| | TypeScript | 5 |
| | Tailwind CSS | 4 |
| | React Hook Form | 7 |
| **Backend** | Spring Boot | 3.4 |
| | Java | 21 |
| | Spring Data JPA | 3.4 |
| | Spring Security Crypto (BCrypt) | 6 |
| | Spring Actuator + Micrometer Prometheus | 3.4 |
| | Lombok | latest |
| **Banco** | PostgreSQL | 16 (`pg_trgm`, `tsvector`) |
| **Storage** | MinIO | 2024-11 (S3-compatível) |
| **Imagens** | Thumbnailator | 0.4.20 |
| **Migrações** | Flyway | latest |
| **Deploy** | Docker Compose + Dokploy + Traefik | — |
| **Pre-commit** | Husky | latest |

---

## Arquitetura

Monorepo com 4 serviços orquestrados por Docker Compose, isolados em redes separadas.

### Topologia de Redes Docker

```
┌────────────────────────────────────────────────┐
│              dokploy-network                    │
│       (Traefik routing - somente frontend)      │
└────────────────┬───────────────────────────────┘
                 │
         ┌───────▼──────────┐
         │     Frontend     │  Next.js 15 (porta 3000)
         │   + middleware   │  Auth check + proxy
         └───────┬──────────┘
                 │
         ┌───────▼─────────────────────┐
         │         app-net              │
         │  frontend ↔ backend ↔ minio  │
         └───────┬─────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼────┐      ┌────▼─────┐
    │ Backend │      │  MinIO   │
    │ Spring  │      │ (S3 API) │
    └────┬────┘      └──────────┘
         │
    ┌────▼─────────┐
    │    db-net    │ (internal: true — sem acesso externo)
    └────┬─────────┘
         │
    ┌────▼───────┐
    │ PostgreSQL │  + pg_trgm + UUID v7
    └────────────┘
```

### Fluxo de Requisições

1. **Browser** → `https://catalogo.paulobof.com.br` → **Traefik** → **Frontend (Next.js)**
2. **Middleware Next.js** verifica cookie `catalog-session`. Sem cookie → redireciona para `/login`.
3. **Server Components (RSC)** chamam o backend diretamente em `http://backend:8080` (rede interna).
4. **Client JS** chama `/api/...` no Next.js, que faz proxy para o backend.
5. **Backend** consulta PostgreSQL e MinIO via redes internas.
6. **MinIO** retorna URLs presigned. O `<Image>` do Next.js otimiza server-side e serve via `/_next/image`.

---

## Autenticação

A aplicação possui **2 usuários fixos** seedados no startup do backend (sem cadastro público).

- Senhas hasheadas com **BCrypt + pepper** (`pepper2`)
- Login retorna informações do usuário; o frontend grava cookie httpOnly `catalog-session` por 7 dias
- Middleware do Next.js bloqueia toda navegação que não seja `/login`, `/api/auth/*`, `/api/health` ou assets estáticos

Os usuários são criados pela classe `UserSeeder` em `backend/.../auth/UserSeeder.java` na primeira inicialização. Se já existirem, o seeder não faz nada.

---

## Início Rápido

### Pré-requisitos

- Docker + Docker Compose v2
- Node.js 22+ e Java 21+ (apenas para desenvolvimento local fora do Docker)

### Subir tudo com Docker Compose

```bash
git clone https://github.com/paulobof/catalog-itens.git
cd catalog-itens
cp .env.example .env
# Edite .env com senhas reais — o compose FALHA se POSTGRES_PASSWORD,
# MINIO_ROOT_PASSWORD ou MINIO_SECRET_KEY não estiverem definidas.

docker compose up -d --build
docker compose ps  # esperar todos ficarem healthy
```

Acessos (em desenvolvimento):
- Frontend: http://localhost:3000
- Backend Actuator: http://localhost:8080/actuator/health
- MinIO Console: http://localhost:9001

Em produção, apenas o frontend é exposto pelo Traefik. Backend e MinIO ficam restritos à rede interna.

### Parar

```bash
docker compose down              # mantém volumes
docker compose down -v           # apaga volumes (perde dados)
```

---

## Desenvolvimento

### Backend

```bash
cd backend
./mvnw spring-boot:run                  # inicia em http://localhost:8080
./mvnw compile -q                       # só checar compilação
./mvnw test                             # rodar testes
```

Requer PostgreSQL e MinIO rodando (via `docker compose up db minio minio-init -d`).

### Frontend

```bash
cd frontend
npm install
npm run dev                              # http://localhost:3000
npm run build && npm start               # build de produção
npm run lint                             # ESLint + TypeScript check
```

### Pre-commit hooks (Husky)

A cada commit, o Husky roda:
- `eslint` + `tsc --noEmit` no frontend
- `mvn compile` no backend

Para bypass: `git commit --no-verify` (não recomendado).

---

## Endpoints da API

### Auth

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login com `{email, password}` |
| POST | `/api/auth/logout` | Limpa cookie de sessão (frontend) |

### Cômodos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET    | `/api/rooms` | Lista cômodos com `thumbnailUrl` |
| GET    | `/api/rooms/{id}` | Detalhe + locais + fotos |
| POST   | `/api/rooms` | Cria cômodo |
| PUT    | `/api/rooms/{id}` | Atualiza cômodo |
| DELETE | `/api/rooms/{id}` | Soft-delete (cascata: locais, fotos) |
| POST   | `/api/rooms/{id}/photos` | Upload de foto (multipart) |
| PUT    | `/api/rooms/{id}/photos/reorder` | Reordena fotos |

### Locais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET    | `/api/locations?roomId=...` | Lista locais (filtrável por cômodo) |
| GET    | `/api/locations/{id}` | Detalhe + produtos com thumbnail + fotos |
| POST   | `/api/locations` | Cria local |
| PUT    | `/api/locations/{id}` | Atualiza local |
| DELETE | `/api/locations/{id}` | Soft-delete (cascata: fotos) |
| POST   | `/api/locations/{id}/photos` | Upload de foto |
| PUT    | `/api/locations/{id}/photos/reorder` | Reordena fotos |

### Produtos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET    | `/api/products?q=&roomId=&tagId=&page=&size=` | Lista paginada com busca full-text |
| GET    | `/api/products/{id}` | Detalhe + locais + tags + fotos |
| POST   | `/api/products` | Cria produto (com tags e locais) |
| PUT    | `/api/products/{id}` | Atualiza produto |
| DELETE | `/api/products/{id}` | Soft-delete + remove fotos do MinIO |
| POST   | `/api/products/{id}/photos` | Upload de foto |
| PUT    | `/api/products/{id}/photos/reorder` | Reordena fotos |

### Tags

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET    | `/api/tags` | Lista tags |
| POST   | `/api/tags` | Cria tag |
| PUT    | `/api/tags/{id}` | Atualiza tag |
| DELETE | `/api/tags/{id}` | Soft-delete |

### Fotos

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| DELETE | `/api/photos/{id}` | Soft-delete + remove do MinIO |

### Health & Observabilidade

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET    | `/api/health` | Frontend health (Next.js, sem proxy) |
| GET    | `/actuator/health` | Backend health |
| GET    | `/actuator/info` | Versão e info do app |
| GET    | `/actuator/metrics` | Lista de métricas |
| GET    | `/actuator/metrics/{nome}` | Valor de uma métrica |
| GET    | `/actuator/prometheus` | Métricas em formato Prometheus |
| GET    | `/actuator/loggers` | Ajusta log levels em runtime |

---

## Observabilidade

### Backend

- **Logs estruturados** com `requestId` correlacionado via MDC (header `X-Request-Id`)
- **`RequestLoggingFilter`** loga todo request com método, path, status e duração
- **`AuthService`** loga cada tentativa de login (sucesso, usuário inexistente, senha incorreta)
- **Spring Actuator** expõe `/health`, `/info`, `/metrics`, `/prometheus`, `/loggers`
- **Micrometer + Prometheus** prontos para conectar Grafana
- **Log level DEBUG** no pacote `com.catalog`
- **Health checks no Docker Compose** (postgres, minio, backend)

### Frontend

- **`/api/auth/login`** loga cada etapa server-side com requestId
- **Login page** loga `[login] submit start`, `[login] response 200`, `[login] success` no console do browser
- **`/api/health`** dedicado (não faz proxy para o backend)
- **`x-pathname` header** propagado pelo middleware para layouts saberem a rota atual

---

## Variáveis de Ambiente

Veja `.env.example` para o template completo. Variáveis críticas (sem default — falham se não definidas):

```bash
POSTGRES_PASSWORD=...           # obrigatório
MINIO_ROOT_PASSWORD=...         # obrigatório
MINIO_SECRET_KEY=...            # obrigatório
```

Variáveis opcionais (com defaults):

```bash
POSTGRES_DB=catalog_itens
POSTGRES_USER=catalog
MINIO_ROOT_USER=minioadmin
MINIO_ACCESS_KEY=catalogsvc
MINIO_BUCKET=catalog-photos

SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/catalog_itens?TimeZone=UTC
SPRING_PROFILES_ACTIVE=prod
APP_STORAGE_MINIO_PRESIGNED_URL_TTL=60   # minutos

API_URL=http://backend:8080              # frontend → backend (interno)
NEXT_PUBLIC_API_URL=                     # vazio = proxy via /api
```

---

## Estrutura do Projeto

```
catalog-itens/
│
├── backend/                              Spring Boot 3.4 + Java 21
│   └── src/main/java/com/catalog/catalogitens/
│       ├── auth/                         AppUser, AuthService, UserSeeder, AuthController
│       ├── room/                         Room entity + service + controller
│       ├── location/                     Location entity + service + controller
│       ├── product/                      Product, ProductLocation, ProductTag
│       ├── tag/                          Tag CRUD
│       ├── photo/                        PhotoService, ThumbnailService, MinioStorageService
│       ├── config/                       MinioConfig, AsyncConfig, CorsConfig,
│       │                                 SecurityHeadersFilter, RequestIdFilter,
│       │                                 RequestLoggingFilter
│       ├── exception/                    GlobalExceptionHandler
│       └── common/                       Helpers compartilhados
│   └── src/main/resources/
│       ├── application.yml               Config + actuator + logging
│       └── db/migration/                 Flyway V1..V6 (incluindo app_user)
│
├── frontend/                             Next.js 15 (App Router) + TS + Tailwind 4
│   ├── src/
│   │   ├── app/
│   │   │   ├── (shell)/                  Layout autenticado (FAB, BottomNav, LogoutBtn)
│   │   │   │   ├── page.tsx              CatalogBrowser
│   │   │   │   ├── search/page.tsx
│   │   │   │   └── tags/page.tsx
│   │   │   ├── login/page.tsx            Tela de login
│   │   │   ├── api/
│   │   │   │   ├── auth/login/route.ts   POST → backend + set cookie
│   │   │   │   ├── auth/logout/route.ts  Limpa cookie
│   │   │   │   ├── health/route.ts       Health do frontend (sem proxy)
│   │   │   │   └── [...path]/route.ts    Catch-all proxy → backend
│   │   │   ├── rooms/[id]/page.tsx       + edit/page.tsx
│   │   │   ├── locations/[id]/page.tsx   + edit/page.tsx
│   │   │   ├── products/[id]/page.tsx    + edit/page.tsx
│   │   │   ├── layout.tsx                Root layout (metadata, fonts)
│   │   │   └── manifest.ts               PWA manifest
│   │   ├── middleware.ts                 Auth check + x-pathname header
│   │   ├── components/
│   │   │   ├── catalog/CatalogBrowser    Drill-down com navegação via URL
│   │   │   ├── photos/                   PhotoUploadZone (câmera + arquivo), PhotoCarousel
│   │   │   ├── rooms/                    RoomCard, RoomForm
│   │   │   ├── locations/                LocationCard, LocationForm
│   │   │   ├── products/                 ProductCard, ProductForm, ProductGrid
│   │   │   ├── tags/                     TagPicker
│   │   │   ├── layout/                   PageHeader (browser-back), BottomNav, FAB, LogoutButton
│   │   │   └── ui/                       Button, Input, Textarea, Card, Badge, Toast, Spinner
│   │   └── lib/
│   │       ├── api/                      client.ts + tipos + funções por recurso
│   │       └── utils/
│   └── public/
│       └── icon.svg                      Ícone SVG (PWA + favicon)
│
├── docker-compose.yml                    Compose principal (4 serviços + 3 redes)
├── docker-compose.dev.yml                Overrides para desenvolvimento
├── docker-compose.prod.yml               Overrides para produção
├── .env.example                          Template de variáveis
├── .husky/                               Pre-commit hooks
└── README.md                             Este arquivo
```

---

## Licença

MIT © 2026 — Paulo Bof

---

**Desenvolvido com 💖 em São Paulo, Brasil**
