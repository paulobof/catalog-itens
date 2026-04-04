# Catalog Itens — PRD & Design Spec

## Visão Geral

Aplicação web responsiva para catalogar itens da casa, organizados por cômodos e locais de armazenamento. Uso pessoal, sem autenticação. Tema visual Barbie (paleta rosa/pink/magenta).

## Stack Técnico

| Camada     | Tecnologia                          |
|------------|-------------------------------------|
| Frontend   | Next.js 15, React 19, Tailwind CSS  |
| Backend    | Spring Boot 3.4, Java 21            |
| Banco      | PostgreSQL 16                        |
| Storage    | MinIO (S3-compatible)                |
| Migrations | Flyway                               |
| Deploy     | Docker Compose (4 containers)        |

## Arquitetura

Monolito Spring Boot simples, organizado por domínio. Frontend Next.js com App Router.

### Containers Docker

| Container  | Imagem              | Porta        |
|------------|---------------------|--------------|
| frontend   | Node 22 (Next.js)   | 3000         |
| backend    | Java 21 (Spring)    | 8080         |
| db         | postgres:16         | 5432         |
| minio      | minio/minio         | 9000 / 9001  |

### Fluxo de Requisição

```
Browser → Next.js (:3000) → REST API → Spring Boot (:8080) → PostgreSQL (:5432)
                                                            → MinIO (:9000) [fotos]
```

## Modelo de Dados

### Room (Cômodo)

| Campo       | Tipo          | Notas              |
|-------------|---------------|--------------------|
| id          | UUID          | PK                 |
| name        | VARCHAR(100)  | NOT NULL           |
| description | TEXT          | Opcional           |
| created_at  | TIMESTAMP     | DEFAULT now()      |
| updated_at  | TIMESTAMP     | DEFAULT now()      |

### Location (Local de armazenamento)

| Campo       | Tipo          | Notas              |
|-------------|---------------|--------------------|
| id          | UUID          | PK                 |
| room_id     | UUID          | FK → Room, NOT NULL|
| name        | VARCHAR(100)  | NOT NULL           |
| description | TEXT          | Opcional           |
| created_at  | TIMESTAMP     | DEFAULT now()      |
| updated_at  | TIMESTAMP     | DEFAULT now()      |

### Product (Produto/Item)

| Campo       | Tipo          | Notas              |
|-------------|---------------|--------------------|
| id          | UUID          | PK                 |
| name        | VARCHAR(150)  | NOT NULL           |
| description | TEXT          | Opcional           |
| created_at  | TIMESTAMP     | DEFAULT now()      |
| updated_at  | TIMESTAMP     | DEFAULT now()      |

### ProductLocation (Junção N:N com quantidade)

| Campo       | Tipo          | Notas                    |
|-------------|---------------|--------------------------|
| id          | UUID          | PK                       |
| product_id  | UUID          | FK → Product, NOT NULL   |
| location_id | UUID          | FK → Location, NOT NULL  |
| quantity    | INTEGER       | NOT NULL, DEFAULT 1      |

Constraint: UNIQUE(product_id, location_id)

### Tag

| Campo | Tipo              | Notas         |
|-------|-------------------|---------------|
| id    | UUID              | PK            |
| name  | VARCHAR(50)       | UNIQUE, NOT NULL |
| color | VARCHAR(7)        | Hex color (#ff69b4) |

### ProductTag (Junção N:N)

| Campo      | Tipo | Notas              |
|------------|------|--------------------|
| product_id | UUID | FK → Product       |
| tag_id     | UUID | FK → Tag           |

PK composta: (product_id, tag_id)

### Photo

| Campo       | Tipo                          | Notas                    |
|-------------|-------------------------------|--------------------------|
| id          | UUID                          | PK                       |
| entity_type | ENUM('product', 'location')   | NOT NULL                 |
| entity_id   | UUID                          | NOT NULL                 |
| url         | VARCHAR(500)                  | URL no MinIO             |
| sort_order  | INTEGER                       | NOT NULL, DEFAULT 0      |

Constraint: Máximo 3 fotos por (entity_type, entity_id) — validado na aplicação.

### Relacionamentos

- **Room 1:N Location** — Um cômodo contém vários locais
- **Product N:N Location** — Via ProductLocation, com quantidade por local
- **Product N:N Tag** — Via ProductTag
- **Photo → Product | Location** — Polimórfica, até 3 por entidade

## API REST

### Rooms

| Método | Endpoint              | Descrição                    |
|--------|-----------------------|------------------------------|
| GET    | /api/rooms            | Listar cômodos               |
| POST   | /api/rooms            | Criar cômodo                 |
| GET    | /api/rooms/{id}       | Detalhe com locais e contagem|
| PUT    | /api/rooms/{id}       | Atualizar cômodo             |
| DELETE | /api/rooms/{id}       | Remover cômodo               |

### Locations

| Método | Endpoint                          | Descrição              |
|--------|-----------------------------------|------------------------|
| GET    | /api/rooms/{roomId}/locations     | Locais do cômodo       |
| POST   | /api/rooms/{roomId}/locations     | Criar local            |
| GET    | /api/locations/{id}               | Detalhe com produtos   |
| PUT    | /api/locations/{id}               | Atualizar local        |
| DELETE | /api/locations/{id}               | Remover local          |

### Products

| Método | Endpoint              | Descrição                              |
|--------|-----------------------|----------------------------------------|
| GET    | /api/products         | Listar (com busca, filtro por room/tag)|
| POST   | /api/products         | Criar produto                          |
| GET    | /api/products/{id}    | Detalhe com locais e tags              |
| PUT    | /api/products/{id}    | Atualizar produto                      |
| DELETE | /api/products/{id}    | Remover produto                        |

### Tags

| Método | Endpoint        | Descrição    |
|--------|-----------------|--------------|
| GET    | /api/tags       | Listar todas |
| POST   | /api/tags       | Criar tag    |
| DELETE | /api/tags/{id}  | Remover tag  |

### Photos

| Método | Endpoint            | Descrição                      |
|--------|---------------------|--------------------------------|
| POST   | /api/photos/upload  | Upload multipart → MinIO       |
| DELETE | /api/photos/{id}    | Remover foto (MinIO + banco)   |

### Search

| Método | Endpoint                    | Descrição                     |
|--------|-----------------------------|-------------------------------|
| GET    | /api/search?q=&room=&tag=   | Busca global com filtros      |

## Telas (Frontend)

### 1. Home (`/`)
- Campo de busca em destaque no topo
- Duas abas: "Cômodos" e "Produtos"
- Aba Cômodos: cards com ícone, nome, contagem de locais/itens
- Aba Produtos: grid de cards com thumbnail, nome, local, tags
- FAB (floating action button) para criar novo item
- Bottom navigation: Home, Buscar, Tags

### 2. Room Detail (`/rooms/[id]`)
- Header com nome do cômodo e foto (se houver)
- Botão voltar
- Lista de locais com ícone, nome e contagem de itens
- FAB para adicionar local

### 3. Location Detail (`/locations/[id]`)
- Header com nome do local e foto (se houver)
- Breadcrumb: Cômodo > Local
- Grid de produtos neste local com quantidade
- FAB para adicionar produto neste local

### 4. Product Detail (`/products/[id]`)
- Carousel de fotos (até 3) com dots indicator
- Nome, descrição
- Tags como badges coloridos
- Seção "Armazenado em" com badges de local + quantidade
- Quantidade total
- Botão editar

### 5. Product Form (`/products/new` e `/products/[id]/edit`)
- Campos: nome, descrição
- Upload de até 3 fotos com preview e reorder
- Seleção de tags (autocomplete, criar nova inline)
- Seleção de locais com quantidade para cada

### 6. Search Results (`/search`)
- Campo de busca no topo
- Filtros: cômodo (dropdown), tags (multi-select)
- Grid de resultados (produtos) com highlight do match

## Design System — Tema Barbie

### Paleta de Cores

| Token     | Hex       | Uso                    |
|-----------|-----------|------------------------|
| bg-light  | #fce4ec   | Background geral       |
| bg-soft   | #f8bbd0   | Cards, surfaces        |
| accent    | #f48fb1   | Bordas, ícones         |
| primary   | #ec407a   | Botões, links          |
| dark      | #c2185b   | Botões hover, badges   |
| text      | #880e4f   | Texto principal        |
| hot-pink  | #ff69b4   | Destaques, gradientes  |
| surface   | #fff5f8   | Background de cards    |

### Tipografia

- Font: **Poppins** (Google Fonts)
- Headings: weight 700-800
- Body: weight 400
- Labels/captions: weight 300

### Componentes

- Cards: `rounded-2xl`, sombra suave, glassmorphism (backdrop-blur)
- Botões: gradiente rosa, `rounded-xl`
- Inputs: borda rosa, `rounded-xl`
- Tags: badges pequenos, cores variadas
- FAB: gradiente rosa, `rounded-xl`, sombra forte

### Responsividade

- Mobile-first (base 320px)
- Tablet (≥768px): 2 colunas de cards
- Desktop (≥1024px): 3-4 colunas, layout com sidebar opcional

### Efeitos

- Glassmorphism: `backdrop-filter: blur(20px)`, fundo semi-transparente
- Gradientes suaves entre tons de rosa
- Hover: `translateY(-4px)` com sombra expandida
- Transições: 200ms ease

## Estrutura do Projeto

```
catalog-itens/
├── backend/
│   ├── src/main/java/com/catalogitens/
│   │   ├── room/           # controller, service, repository, entity
│   │   ├── location/
│   │   ├── product/
│   │   ├── tag/
│   │   ├── photo/
│   │   ├── search/
│   │   └── config/         # MinIO, CORS, WebConfig
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/   # Flyway scripts
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx              # Home
│   │   ├── rooms/[id]/page.tsx   # Room detail
│   │   ├── locations/[id]/page.tsx
│   │   ├── products/page.tsx     # Product list
│   │   ├── products/[id]/page.tsx
│   │   ├── products/new/page.tsx
│   │   └── search/page.tsx
│   ├── src/components/           # UI compartilhados
│   ├── src/lib/                  # API client, utils
│   ├── tailwind.config.ts        # Tema Barbie
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Decisões Técnicas

- **Sem autenticação**: app pessoal, acesso direto
- **UUID como PK**: evita exposição de sequenciais
- **Photo polimórfica**: uma tabela para fotos de products e locations, usando entity_type + entity_id
- **Flyway**: migrations versionadas para schema do banco
- **MinIO**: storage local S3-compatible, fotos acessadas via presigned URLs ou proxy pelo backend
- **Busca**: ILIKE no PostgreSQL para nome/descrição + filtros por room_id e tag_id via JOINs
- **Validação de max 3 fotos**: na camada de service do backend
- **Tags livres**: criadas sob demanda, sem hierarquia
