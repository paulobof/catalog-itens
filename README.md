# Catálogo de Itens - Home Inventory App

[![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue?style=flat-square)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](docker-compose.yml)

Aplicação web moderna para catalogar e organizar itens da casa por cômodos e locais de armazenamento. Interface elegante com tema visual Barbie (rosa/pink) para uma experiência visual agradável.

**Website:** [catalogo.paulobof.com.br](http://catalogo.paulobof.com.br)

---

## Índice

- [Características](#características)
- [Stack Técnico](#stack-técnico)
- [Arquitetura](#arquitetura)
- [Início Rápido](#início-rápido)
- [Desenvolvimento](#desenvolvimento)
- [Endpoints da API](#endpoints-da-api)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Licença](#licença)

---

## Características

- **CRUD Completo**: Gerenciamento de cômodos, locais de armazenamento, produtos e tags
- **Busca Full-Text**: Implementada com `tsvector` PostgreSQL e busca por trigrama para resultados precisos
- **Upload de Fotos**: Suporte para até 3 imagens por entidade com armazenamento em MinIO (S3-compatível)
- **Tema Barbie**: Design elegante com paleta de cores rosa/pink
- **PWA Ready**: Progressive Web App pronto para instalação e uso offline
- **Navegação SPA**: Routes intercepting para experiência fluida sem recarregar página
- **Responsive**: Design mobile-first otimizado para todos os dispositivos
- **Soft Delete**: Exclusão lógica com cascade automático para integridade referencial

---

## Stack Técnico

| Camada | Tecnologia | Versão | Propósito |
|--------|-----------|--------|----------|
| **Frontend** | Next.js | 15.3.9 | Framework React full-stack |
| **Frontend** | React | 19.0.0 | Biblioteca UI |
| **Frontend** | TypeScript | 5.0.0 | Type safety |
| **Frontend** | Tailwind CSS | 4.0.0 | Styling e tema Barbie |
| **Frontend** | React Hook Form | 7.54.0 | Gerenciamento de formulários |
| **Frontend** | SWR | 2.3.0 | Data fetching e caching |
| **Backend** | Spring Boot | 3.4.1 | Framework Java |
| **Backend** | Java | 21 | Runtime |
| **Backend** | Lombok | Latest | Redução de boilerplate |
| **Backend** | Spring Data JPA | Latest | ORM e data access |
| **Backend** | Spring Validation | Latest | Validação de dados |
| **Backend** | Spring Actuator | Latest | Health checks e monitoring |
| **Banco de Dados** | PostgreSQL | 16 | Relational database com pg_trgm |
| **Armazenamento** | MinIO | 2024-11-07 | Object storage (S3-compatível) |
| **Migrações** | Flyway | Latest | Versionamento de schema |
| **Processamento de Imagens** | Thumbnailator | 0.4.20 | Geração de thumbnails |
| **Deploy** | Docker & Compose | Latest | Containerização |
| **Proxy Reverso** | Dokploy + Traefik | Latest | Gerenciamento de rotas |
| **CI/CD** | Husky | Latest | Pre-commit hooks |

---

## Arquitetura

A aplicação segue uma arquitetura **monorepo** com separação clara entre frontend e backend, orquestrados por Docker Compose.

### Topologia de Redes Docker

```
┌─────────────────────────────────────────────────┐
│                 frontend-net                     │
│         (Public-facing - apenas frontend)        │
└────────────────┬────────────────────────────────┘
                 │ (porta 4000)
         ┌───────▼─────────┐
         │     Frontend    │ (Next.js 15)
         │   (Next.js)     │
         └───────┬─────────┘
                 │
         ┌───────▼──────────────────────┐
         │        app-net               │
         │  (Service bus interno)       │
         │  frontend ↔ backend ↔ minio  │
         └───────┬──────────────────────┘
                 │
       ┌─────────┼─────────┐
       │         │         │
   ┌───▼───┐ ┌──▼────┐ ┌──▼────┐
   │Backend│ │MinIO  │ │MinIO  │
   │ (Java)│ │(S3)   │ │Init   │
   └───┬───┘ └───────┘ └───────┘
       │
   ┌───▼──────────────────┐
   │       db-net         │
   │  (Internal: true)    │
   │  backend ↔ postgres  │
   └──────────────────────┘
       │
   ┌───▼────────┐
   │ PostgreSQL │ (16)
   │  + pg_trgm │
   └────────────┘
```

### Componentes Principais

- **Frontend Container**: Next.js 15 (porta 4000) - aplicação React com RSC e Server Actions
- **Backend Container**: Spring Boot 3.4 (porta 8080) - API REST com validação e autenticação
- **Database Container**: PostgreSQL 16 - com extensão pg_trgm para busca trigram
- **MinIO Container**: Object storage S3-compatível para imagens
- **MinIO Init Container**: Bootstrapper one-shot para configurar buckets e service accounts

### Fluxo de Dados

1. **Client** (browser) → **Frontend** (Next.js route handlers)
2. **Server Components** (RSC) → **Backend** (diretamente via API_URL interno)
3. **Client JS** (SWR) → **Frontend** (proxy) → **Backend**
4. **Backend** → **PostgreSQL** (queries com full-text search)
5. **Backend** → **MinIO** (upload/download de fotos)

---

## Início Rápido

### Pré-requisitos

- **Docker & Docker Compose** (v20.10+)
- **Node.js 22+** (apenas para desenvolvimento)
- **Java 21+** (apenas para desenvolvimento)
- **Git**

### Início com Docker Compose (Recomendado)

1. **Clone o repositório:**
```bash
git clone https://github.com/seu-usuario/catalog-itens.git
cd catalog-itens
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

3. **Edite o `.env` com suas senhas e configurações:**
```bash
# Banco de Dados
POSTGRES_DB=catalog_itens
POSTGRES_USER=catalog
POSTGRES_PASSWORD=sua_senha_segura_aqui

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=sua_senha_minio_aqui
MINIO_ACCESS_KEY=catalog-svc
MINIO_SECRET_KEY=sua_chave_secreta_aqui

# Spring
SPRING_PROFILES_ACTIVE=prod
```

4. **Inicie os containers:**
```bash
docker compose up -d --build
```

5. **Aguarde o health check:** (cerca de 60 segundos)
```bash
docker compose ps
```

Todos os containers devem ter status `healthy` ou `running`.

6. **Acesse a aplicação:**
- Frontend: http://localhost:4000
- Backend Health: http://localhost:8080/actuator/health (dev only)
- MinIO Console: http://localhost:9001 (dev only)

### Parar os Containers

```bash
docker compose down
```

Para remover volumes de dados:
```bash
docker compose down -v
```

---

## Desenvolvimento

### Setup Local - Backend

1. **Navegue para o diretório backend:**
```bash
cd backend
```

2. **Configure o banco de dados:**
```bash
# PostgreSQL deve estar rodando em localhost:5432
# Use as credenciais do seu ambiente
```

3. **Compile e execute:**
```bash
# Usando Maven wrapper
./mvnw clean install
./mvnw spring-boot:run

# Ou com Java 21 direto
java -version  # Verifique se é 21+
```

4. **API estará em:** http://localhost:8080

### Setup Local - Frontend

1. **Navegue para o diretório frontend:**
```bash
cd frontend
```

2. **Instale dependências:**
```bash
npm install
# ou
yarn install
```

3. **Configure variáveis de ambiente:**
```bash
# .env.local
API_URL=http://localhost:8080  # Para Server Components
NEXT_PUBLIC_API_URL=           # Para Client (proxy via route handlers)
```

4. **Inicie o dev server com Turbopack:**
```bash
npm run dev
```

5. **Frontend estará em:** http://localhost:3000

### Build para Produção

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
./mvnw clean package
java -jar target/catalog-itens-1.0.0-SNAPSHOT.jar
```

---

## Endpoints da API

A API REST fornece os seguintes endpoints:

### Cômodos (Rooms)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/rooms` | Lista todos os cômodos |
| GET | `/api/rooms/{id}` | Obtém um cômodo específico |
| POST | `/api/rooms` | Cria um novo cômodo |
| PUT | `/api/rooms/{id}` | Atualiza um cômodo |
| DELETE | `/api/rooms/{id}` | Deleta um cômodo (soft delete) |

### Locais (Locations)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/locations` | Lista todos os locais |
| GET | `/api/locations/room/{roomId}` | Lista locais de um cômodo |
| GET | `/api/locations/{id}` | Obtém um local específico |
| POST | `/api/locations` | Cria um novo local |
| PUT | `/api/locations/{id}` | Atualiza um local |
| DELETE | `/api/locations/{id}` | Deleta um local (soft delete) |

### Produtos (Products)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/products` | Lista todos os produtos (com paginação) |
| GET | `/api/products/search` | Busca full-text por produtos |
| GET | `/api/products/{id}` | Obtém um produto específico |
| GET | `/api/products/location/{locationId}` | Produtos em um local |
| POST | `/api/products` | Cria um novo produto |
| PUT | `/api/products/{id}` | Atualiza um produto |
| DELETE | `/api/products/{id}` | Deleta um produto (soft delete) |

### Fotos (Photos)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/photos/upload` | Faz upload de foto (max 5MB) |
| GET | `/api/photos/{id}/download` | Download da foto original |
| GET | `/api/photos/{id}/thumbnail` | Download do thumbnail |
| DELETE | `/api/photos/{id}` | Deleta uma foto |

### Tags

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tags` | Lista todas as tags |
| POST | `/api/tags` | Cria uma nova tag |
| PUT | `/api/tags/{id}` | Atualiza uma tag |
| DELETE | `/api/tags/{id}` | Deleta uma tag |

### Health Checks

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Frontend health check |
| GET | `/actuator/health` | Backend health check (Spring) |

### Busca Full-Text

**Endpoint especial:**
```bash
GET /api/products/search?q=termo_busca&limit=20&offset=0
```

Usa `tsvector` PostgreSQL para busca rápida em múltiplos campos:
- Nome do produto
- Descrição
- Tags associadas
- Cômodo e local

---

## Estrutura do Projeto

```
catalog-itens/
│
├── backend/
│   ├── src/
│   │   ├── main/java/com/catalog/
│   │   │   ├── entity/               # Entidades JPA
│   │   │   ├── repository/           # Spring Data JPA
│   │   │   ├── service/              # Lógica de negócio
│   │   │   ├── controller/           # REST endpoints
│   │   │   ├── config/               # Configurações Spring
│   │   │   ├── exception/            # Exceções customizadas
│   │   │   └── util/                 # Utilidades
│   │   ├── resources/
│   │   │   ├── application.yml       # Config padrão
│   │   │   ├── application-prod.yml  # Config produção
│   │   │   ├── application-dev.yml   # Config desenvolvimento
│   │   │   └── db/migration/         # Scripts Flyway
│   │   └── test/                     # Testes unitários e integração
│   ├── pom.xml                       # Dependências Maven
│   └── Dockerfile                    # Build Docker
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/                   # Route group para auth (privado)
│   │   ├── (public)/                 # Route group para públicas
│   │   ├── @interceptor/             # Routes interceptadas
│   │   ├── api/                      # API route handlers (proxy)
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── components/
│   │   ├── rooms/                    # Componentes de cômodos
│   │   ├── locations/                # Componentes de locais
│   │   ├── products/                 # Componentes de produtos
│   │   ├── photos/                   # Componentes de fotos
│   │   ├── common/                   # Componentes reutilizáveis
│   │   └── ui/                       # Componentes de UI base
│   ├── hooks/
│   │   ├── useRooms.ts               # SWR hook para cômodos
│   │   ├── useLocations.ts           # SWR hook para locais
│   │   ├── useProducts.ts            # SWR hook para produtos
│   │   └── useApi.ts                 # SWR hook genérico
│   ├── lib/
│   │   ├── api.ts                    # Funções de API client
│   │   ├── types.ts                  # Tipos TypeScript
│   │   └── constants.ts              # Constantes da app
│   ├── styles/
│   │   ├── globals.css               # Tailwind globals
│   │   ├── themes.css                # Tema Barbie
│   │   └── animations.css            # Animações customizadas
│   ├── public/
│   │   ├── icons/                    # PWA icons
│   │   ├── images/                   # Assets estáticos
│   │   └── manifest.json             # PWA manifest
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts            # Config Tailwind (tema Barbie)
│   ├── next.config.ts
│   └── Dockerfile
│
├── docker-compose.yml                 # Compose base
├── docker-compose.dev.yml             # Overrides desenvolvimento
├── docker-compose.prod.yml            # Overrides produção
├── .env.example                       # Template de variáveis
├── .gitignore
├── .dockerignore
├── LICENSE
└── README.md (este arquivo)
```

---

## Variáveis de Ambiente

### Backend (Spring Boot)

```bash
# ============= Profiles e Deploy =============
SPRING_PROFILES_ACTIVE=prod           # prod ou dev

# ============= Database =============
SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/catalog_itens?TimeZone=UTC
SPRING_DATASOURCE_USERNAME=catalog
SPRING_DATASOURCE_PASSWORD=catalog_secret_2024

# ============= HikariCP Connection Pool =============
SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE=2
SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=10
SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=30000
SPRING_DATASOURCE_HIKARI_MAX_LIFETIME=1800000

# ============= MinIO (Object Storage) =============
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=catalog-svc
MINIO_SECRET_KEY=catalog_minio_key
MINIO_BUCKET=catalog-photos

# ============= File Upload =============
SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=5MB        # Máximo por arquivo
SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=15MB    # Máximo por request

# ============= Presigned URLs =============
APP_STORAGE_MINIO_PRESIGNED_URL_TTL=60            # Segundos
```

### Frontend (Next.js)

```bash
# ============= Environment =============
NODE_ENV=production

# ============= API URLs =============
API_URL=http://backend:8080           # Server-side (RSC/Server Actions)
NEXT_PUBLIC_API_URL=                  # Client-side (proxy via route handlers)

# ============= Next.js =============
NEXT_TELEMETRY_DISABLED=1
```

### PostgreSQL

```bash
POSTGRES_DB=catalog_itens
POSTGRES_USER=catalog
POSTGRES_PASSWORD=catalog_secret_2024
PGDATA=/var/lib/postgresql/data/pgdata
```

### MinIO

```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minio_secret_2024
```

Ver `.env.example` para referência completa.

---

## Requisitos de Sistema

### Produção (Docker)

- CPU: 2+ cores
- RAM: 2GB mínimo, 4GB recomendado
- Armazenamento: 20GB para dados
- Espaço para fotos: ajuste conforme uso
- Conexão de rede: 1Mbps (mínimo)

### Desenvolvimento

- **Node.js**: 22+
- **Java**: 21+ (para backend)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

---

## Performance e Otimizações

- **Frontend**: Turbopack para build rápido, next/image para otimização de imagens
- **Backend**: HikariCP com pool de conexões, prepared statements, indexes no PostgreSQL
- **Banco**: Full-text search com `tsvector`, trigram search com `pg_trgm`
- **Armazenamento**: MinIO com compressão automática, presigned URLs para bypass de proxy
- **Docker**: Multi-stage builds, imagens Alpine, healthchecks automáticos

---

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

Por favor, certifique-se de:
- Seguir os padrões de código do projeto
- Adicionar testes para novas funcionalidades
- Atualizar a documentação conforme necessário
- Passar nos pre-commit hooks (Husky)

---

## Troubleshooting

### Containers não iniciam

```bash
# Verificar logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Verificar saúde
docker compose ps
docker compose exec backend curl http://localhost:8080/actuator/health
```

### Erro de conexão com banco de dados

```bash
# Verificar se PostgreSQL está healthy
docker compose exec db pg_isready

# Resetar banco (cuidado!)
docker compose down -v
docker compose up -d --build
```

### MinIO bucket não foi criado

```bash
# Re-executar minio-init
docker compose up minio-init
```

### Porta já em uso

```bash
# Mudar porta no docker-compose.yml ou usar:
docker compose up -d -p custom_port:4000
```

---

## Roadmap

- [ ] Autenticação e autorização por usuário
- [ ] Compartilhamento de catálogos entre usuários
- [ ] Notificações de itens vencidos/expiráveis
- [ ] Exportação de catálogo (PDF/Excel)
- [ ] Integração com código de barras/QR code
- [ ] App mobile nativa (React Native)
- [ ] Analytics e relatórios

---

## Licença

MIT © 2026 - Paulo Bof

Este projeto é fornecido "como está" sem garantias. Veja [LICENSE](LICENSE) para detalhes.

---

## Suporte

Para dúvidas, sugestões ou relatar bugs:
- Abra uma [GitHub Issue](https://github.com/seu-usuario/catalog-itens/issues)
- Envie um email para: seu-email@exemplo.com

---

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para histórico de versões.

---

**Desenvolvido com 💖 em Brasil**
