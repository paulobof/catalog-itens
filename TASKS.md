# Tarefas — Code Review Consolidado

> Resultado consolidado de 9 agentes especialistas (Java, TypeScript, Database, Security, Architecture, Performance, Accessibility, Pentest, QA).
> ~60 achados unicos agrupados por severidade e organizados em sprints executaveis.

**Legenda:** 🔴 Bloqueador · 🟠 Alto · 🟡 Medio · ⚪ Baixo
**Status:** `[ ]` pendente · `[x]` concluido · `[-]` em progresso · `[~]` aceito como divida consciente

---

## Sprint 0 — ESTA SEMANA (Seguranca Critica)

> Os itens deste bloco transformam a autenticacao de "teatro" em real. **Nao deploy nada novo antes destes itens.**

### 🔴 SEC-01 — Trocar senhas dos 2 usuarios em todos os sistemas onde foram reutilizadas
- [ ] Trocar senha de `paulobof@gmail.com` (estava `***REMOVED***`)
- [ ] Trocar senha de `tamara_saka@hotmail.com` (estava `***REMOVED***`)
- [ ] Auditar contas externas que possam usar o padrao `Pt + 6 digitos + @` (credential stuffing)
- **Tempo:** 30 min
- **Origem:** Java#1, Security CRIT-3, Pentest HIGH-01, Architecture D-02

### 🔴 SEC-02 — Mover seed de usuarios para variaveis de ambiente
- [ ] Adicionar env vars `SEED_USER_1_EMAIL`, `SEED_USER_1_PASSWORD`, `SEED_USER_1_NAME` (idem 2)
- [ ] Refatorar `UserSeeder.java` para ler de env vars
- [ ] Documentar no `.env.example`
- [ ] Considerar `git filter-repo` ou aceitar leak no historico
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/auth/UserSeeder.java:20-21`
- **Tempo:** 1h

### 🔴 SEC-03 — Mover pepper para env var
- [ ] `@Value("${app.auth.pepper}")` em `AuthService.java:15`
- [ ] Adicionar `APP_AUTH_PEPPER` no `.env.example` e `application.yml`
- [ ] Adicionar no `docker-compose.yml` com `:?` (obrigatorio)
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/auth/AuthService.java:15`
- **Tempo:** 30 min
- **Origem:** Java#2, Security CRIT-4, Pentest HIGH-01, Architecture D-03

### 🔴 SEC-04 — Assinar cookie de sessao (eliminar forja Base64)
- [ ] Instalar `iron-session` ou `jose` no frontend
- [ ] Gerar e assinar token no `/api/auth/login/route.ts:48`
- [ ] Validar assinatura no `middleware.ts`
- [ ] Adicionar env var `SESSION_SECRET` (min 32 chars)
- [ ] Em prod, marcar `secure: true` incondicionalmente (nao depender de NODE_ENV)
- **Arquivos:** `frontend/src/app/api/auth/login/route.ts`, `frontend/src/middleware.ts`
- **Tempo:** 4-6h
- **Origem:** TS#6, Security CRIT-1, Pentest CRIT-01, Architecture D-01

### 🔴 SEC-05 — Adicionar Spring Security no backend
- [ ] Adicionar `spring-boot-starter-security` ao `pom.xml`
- [ ] Criar `SecurityFilterChain` exigindo auth em `/api/**`
- [ ] Permitir `/api/auth/login`, `/actuator/health`
- [ ] Validar JWT do mesmo segredo do frontend (ou Authorization Bearer)
- [ ] Restringir CORS para origens conhecidas (sem `*` em allowedHeaders)
- **Tempo:** 1 dia
- **Origem:** Java#3, Security CRIT-2, Pentest CRIT-02, Architecture D-18

### 🔴 SEC-06 — Rate limiting no `/api/auth/login`
- [ ] Adicionar `bucket4j-spring-boot-starter`
- [ ] 5 tentativas por IP/15min
- [ ] 10 tentativas por email/hora
- [ ] Lockout exponencial apos N falhas
- **Tempo:** 2-3h
- **Origem:** Security HIGH-2, Pentest CRIT-03, Architecture D-20

### 🔴 SEC-07 — Atualizar Next.js para 15.5.14 (6 CVEs corrigidos)
- [ ] `npm install next@15.5.14` no frontend
- [ ] Rebuild + smoke test
- **CVEs corrigidos:** SSRF middleware, request smuggling, image optimizer DoS x4
- **Tempo:** 30 min + testes
- **Origem:** Security HIGH-5

### 🔴 SEC-08 — Validar dimensoes de imagem antes de carregar (decompression bomb)
- [ ] Em `PhotoService.readAndReencode()`, usar `ImageReader.getWidth/getHeight()` em modo lazy
- [ ] Rejeitar `width * height > 50_000_000`
- [ ] Adicionar `InvalidFileException` com mensagem clara
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/photo/PhotoService.java:188-201`
- **PoC do ataque:** `Image.new('RGB', (60000, 60000)) → ~80KB → 30GB heap`
- **Tempo:** 2h
- **Origem:** Pentest MED-02

---

## Sprint 1 — Performance e Quick Wins

### 🟠 PERF-01 — Eliminar N+1 em `RoomService.findAll()`
- [ ] Substituir loop de `countActiveLocationsByRoomId` + `countActiveProductsByRoomId` por query agregada com `GROUP BY`
- [ ] Criar metodo no `RoomRepository` retornando `Map<UUID, RoomCounts>`
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/room/RoomService.java:34-47`
- **Impacto:** 50 rooms = de 101 queries para 3
- **Tempo:** 2h
- **Origem:** Java#5, DB#1, Performance#2, Architecture D-04

### 🟠 PERF-02 — Eliminar N+1 em `ProductService.search()`
- [ ] Coletar `productIds` da pagina apos `searchProducts`
- [ ] Usar `thumbnailService.generateFirstThumbnailUrls("product", ids)` (ja existe!)
- [ ] Remover loop individual de `findActiveByEntityTypeAndEntityId`
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/product/ProductService.java:51-55`
- **Impacto:** 20 produtos = de 21 queries para 2
- **Tempo:** 1h
- **Origem:** Java#7, DB#5, Performance#1, Architecture D-05

### 🟠 PERF-03 — Eliminar N+1 em `RoomService.findById()`
- [ ] Coletar `locationIds` antes do loop
- [ ] Usar `thumbnailService.generateFirstThumbnailUrls("location", ids)`
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/room/RoomService.java:59-60`
- **Tempo:** 1h
- **Origem:** Java#6, DB#6, Performance#8

### 🟠 PERF-04 — Cache de presigned URLs do MinIO
- [ ] Adicionar Caffeine ao `pom.xml`
- [ ] Em `MinioStorageService`, cachear presigned URLs com TTL `presignedUrlTtl - 1min`
- [ ] Tamanho max: 5000 entries
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/photo/MinioStorageService.java:41`
- **Impacto:** Elimina 95%+ das chamadas HTTP ao MinIO em listagens
- **Tempo:** 2-3h
- **Origem:** Performance#3

### 🟠 DB-01 — Corrigir UUID v7 (Hibernate gera v4 atualmente!)
- [ ] Substituir `@GeneratedValue(GenerationType.UUID)` por `@org.hibernate.annotations.UuidGenerator(style = TIME)` em todas as entidades
- [ ] Entidades: `Product`, `Room`, `Location`, `Photo`, `ProductLocation`, `Tag`, `AppUser`
- [ ] Validar que IDs novos sao v7 com `SELECT id FROM ... LIMIT 5; -- versao 7?`
- **Impacto:** Restaura localidade de B-tree no PK (otimiza inserts e ranges temporais)
- **Tempo:** 1h
- **Origem:** DB#4

### 🟠 ARCH-01 — MinIO health → readiness, nao liveness
- [ ] Mover `MinioHealthIndicator` para grupo `readiness`
- [ ] Ou desabilitar via `management.health.minio.enabled=false`
- [ ] Validar que MinIO down nao derruba o backend `unhealthy` no Docker
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/photo/MinioHealthIndicator.java`
- **Impacto:** MinIO down nao derruba CRUD de tudo
- **Tempo:** 1h
- **Origem:** Architecture (modos de falha)

### 🟠 SEC-09 — Remover CSP `unsafe-inline` e `unsafe-eval`
- [ ] Editar `frontend/next.config.ts:49-58`
- [ ] Usar nonces para scripts inline necessarios
- [ ] Restringir `connect-src` por ambiente (sem `http://localhost:8080` em prod)
- **Tempo:** 3-4h
- **Origem:** Pentest HIGH-04

### 🟠 PERF-05 — Corrigir `generateThumbnailUrl` para retornar a chave do thumb real
- [ ] Hoje retorna URL do original 2048px (decisao consciente, mas nao otimo)
- [ ] Manter o thumb 600px gerado e usar a chave correta
- [ ] Next.js vai otimizar muito mais barato em telas com < 200px
- **Arquivo:** `backend/.../photo/ThumbnailService.java:38-47`
- **Tempo:** 30 min
- **Origem:** Architecture D-06

### 🟠 TS-01 — Vazamento de blob URLs no PhotoUploadZone
- [ ] Mover `URL.createObjectURL` para `useMemo` com identidade estavel do `File`
- [ ] OU criar URLs em `addFiles` e armazenar em state
- [ ] Garantir que `useEffect` cleanup revoga TODAS as URLs antigas
- **Arquivo:** `frontend/src/components/photos/PhotoUploadZone.tsx:52-68`
- **Tempo:** 2h
- **Origem:** TS#1

### 🟠 TS-02 — Verificar `res.ok` em `CatalogBrowser.tsx`
- [ ] Adicionar checagem em `loadFromUrl` para os 3 fetches (linhas 149, 159, 162)
- [ ] Mostrar toast de erro em caso de falha
- [ ] Garantir que loading nao fica eterno
- **Arquivo:** `frontend/src/components/catalog/CatalogBrowser.tsx`
- **Tempo:** 1h
- **Origem:** TS#5

### 🟠 TS-03 — `catch {}` silenciando erros nos `*Form.tsx`
- [ ] Mostrar mensagem de erro real em vez de toast generico
- [ ] Logar via `console.error` em dev
- [ ] Considerar Sentry/similar em prod
- **Arquivos:** `ProductForm.tsx:216`, `RoomForm.tsx:117`, `LocationForm.tsx:129`
- **Tempo:** 1-2h
- **Origem:** TS#2

---

## Sprint 2 — Auth, Contratos e Estrutura

### 🟠 SEC-10 — CSRF token (Double Submit Cookie)
- [ ] Gerar token CSRF no cookie de sessao assinado
- [ ] Exigir header `X-CSRF-Token` em mutacoes POST/PUT/DELETE
- [ ] Validar no proxy `[...path]/route.ts`
- **Tempo:** 4h
- **Origem:** Security HIGH-1, Pentest HIGH-03

### 🟠 SEC-11 — Hardening do Actuator
- [ ] Remover `loggers`, `metrics`, `prometheus` do `include` (ou proteger com auth)
- [ ] `management.endpoint.health.show-details: never` (ou condicional)
- [ ] Considerar porta de gerenciamento separada via `management.server.port`
- **Arquivo:** `backend/src/main/resources/application.yml:54-71`
- **Tempo:** 1h
- **Origem:** Java#4, Security CRIT-5, Pentest MED-04

### 🟠 SEC-12 — Hardening do middleware (path matching)
- [ ] Substituir `startsWith()` por igualdade exata + lista pequena de prefixos
- [ ] `/loginha-ha`, `/api/healthx`, `/api/auth-bypass` nao devem passar
- **Arquivo:** `frontend/src/middleware.ts:3-7`
- **Tempo:** 30 min
- **Origem:** Pentest HIGH-02

### 🟠 SEC-13 — Allowlist no proxy `[...path]/route.ts`
- [ ] Verificar `path[0]` esta em `["products","rooms","locations","photos","tags","auth"]`
- [ ] Adicionar `signal: AbortSignal.timeout(30_000)` no fetch
- **Arquivo:** `frontend/src/app/api/[...path]/route.ts`
- **Tempo:** 1h
- **Origem:** Security HIGH-4, Pentest LOW-01

### 🟠 ARCH-02 — Codegen de tipos TypeScript via OpenAPI
- [ ] Adicionar `springdoc-openapi-starter-webmvc-ui` ao backend
- [ ] Adicionar `openapi-typescript` ao frontend
- [ ] Script `npm run gen:types` que consome `/v3/api-docs` e gera `src/lib/api/generated.ts`
- [ ] Substituir tipos manuais em `lib/api/types.ts`
- **Impacto:** Elimina classe inteira de bugs por desalinhamento (5+ identificados)
- **Tempo:** 1 dia
- **Origem:** Architecture D-07

### 🟠 ARCH-03 — Eliminar `entityManager.flush/clear` workaround
- [ ] Investigar causa raiz no `ProductService.create()`
- [ ] Provavelmente: adicionar `product.getProductTags().add(pt)` apos cada save
- [ ] Configurar `cascade = ALL, orphanRemoval = true` corretamente
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/product/ProductService.java:155-157`
- **Tempo:** 4h (investigacao + fix)
- **Origem:** Java#10, Architecture D-11

### 🟡 ARCH-04 — Enum `PhotoEntityType`
- [ ] Criar enum com `PRODUCT`, `LOCATION`, `ROOM`
- [ ] Substituir literais `"product"/"location"/"room"` em todos os 5 lugares
- [ ] Adicionar `getStorageFolder()` e `getDbValue()`
- **Tempo:** 2h
- **Origem:** Architecture P3.3

### 🟡 ARCH-05 — Padronizar paginacao em todas as listagens
- [ ] Decidir: tudo paginado ou tudo plain (recomendacao: tudo paginado quando > 50 itens)
- [ ] Atualizar `RoomController`, `LocationController`, `TagController`
- [ ] Atualizar tipos no frontend
- **Tempo:** 4h
- **Origem:** Architecture P4.2

### 🟡 ARCH-06 — Versionar API `/api/v1/`
- [ ] Adicionar prefixo `/v1` em todos os controllers
- [ ] Atualizar proxy do frontend
- [ ] Atualizar `client.ts`
- **Tempo:** 1h
- **Origem:** Architecture P4.1

### 🟡 JAVA-01 — Repositorios `@Modifying` sem `@Transactional`
- [ ] Adicionar `@Transactional` em todos os metodos `@Modifying`
- [ ] `ProductTagRepository`, `ProductLocationRepository`, `LocationRepository`
- **Tempo:** 1h
- **Origem:** Java#8

### 🟡 JAVA-02 — `BCryptPasswordEncoder` como `@Bean`
- [ ] Mover de `static` em `AuthService` para `@Bean` em uma `@Configuration`
- [ ] Injetar via construtor
- **Tempo:** 30 min
- **Origem:** Java#9

### 🟡 DB-02 — Padronizar filtro `deleted_at` no `PhotoRepository`
- [ ] Adicionar `AND p.deletedAt IS NULL` explicito em todas as queries JPQL
- [ ] Tornar comportamento independente do `@SQLRestriction`
- **Tempo:** 30 min
- **Origem:** Java#12, DB#9

---

## Sprint 3 — Resilience e UX

### 🟠 SEC-14 — Email logado em texto plano (LGPD/PII)
- [ ] Mascarar emails nos logs: `paulo***@gmail.com`
- [ ] Aplicar em `AuthService` e `api/auth/login/route.ts`
- [ ] Considerar logar so o ID apos autenticacao
- **Tempo:** 1h
- **Origem:** Security MED-8, Pentest LOW-02

### 🟠 SEC-15 — Eliminar timing attack no login
- [ ] Sempre executar BCrypt mesmo se usuario nao existe (usar dummy hash)
- [ ] Mensagem de log unica para "login falhou" (sem distinguir motivo)
- **Arquivo:** `backend/src/main/java/com/catalog/catalogitens/auth/AuthService.java:24-33`
- **Tempo:** 1h
- **Origem:** Security HIGH-3

### 🟡 PERF-06 — Eliminar waterfall no `CatalogBrowser.loadFromUrl`
- [ ] Hoje: 3 fetches serializados (locations → location/:id → products?roomId)
- [ ] Opcao A: usar `LocationDetail.products` que ja vem com thumbnail (eliminar 3o fetch)
- [ ] Opcao B: adicionar `locationId` como filtro no `/api/products`
- **Arquivo:** `frontend/src/components/catalog/CatalogBrowser.tsx:148-164`
- **Tempo:** 2-3h
- **Origem:** Performance#4, Architecture D-17

### 🟡 PERF-07 — `force-dynamic` revisar uso
- [ ] Avaliar se `/products/[id]` pode usar `revalidate = 60`
- [ ] Manter `force-dynamic` so onde dados mudam constantemente
- **Tempo:** 2h
- **Origem:** Performance#7

### 🟡 PERF-08 — `PhotoCarousel` so renderizar foto ativa + vizinhas
- [ ] Substituir `opacity-0` por `display:none` ou unmount
- [ ] Renderizar so `index === current` e `Math.abs(index - current) <= 1`
- **Arquivo:** `frontend/src/components/photos/PhotoCarousel.tsx:76-83`
- **Tempo:** 1h
- **Origem:** Performance#9

### 🟡 ARCH-07 — Domain events para cascade de soft-delete
- [ ] Publicar `RoomDeletedEvent` em `RoomService.delete()`
- [ ] Listeners em outros contexts limpam suas entidades
- [ ] Remove acoplamento bidirecional entre services
- **Tempo:** 1 dia
- **Origem:** Architecture P5.2

### 🟡 ARCH-08 — Outbox table para thumbnails
- [ ] Substituir `ThreadPoolTaskExecutor` por outbox no DB
- [ ] Job poll que processa thumbnails (sobrevive a reinicio)
- **Tempo:** 1 dia
- **Origem:** Architecture D-14

### 🟡 A11Y-01 — Login form sem `aria-required`
- [ ] Adicionar `aria-required="true"` nos inputs
- **Arquivo:** `frontend/src/app/login/page.tsx:73-98`
- **Tempo:** 5 min
- **Origem:** A11y BLOCKER 1.1

### 🟡 A11Y-02 — Breadcrumb do CatalogBrowser usar `<ol>/<li>`
- [ ] Refatorar de `<button>` para lista ordenada com `aria-current`
- **Arquivo:** `frontend/src/components/catalog/CatalogBrowser.tsx:278-337`
- **Tempo:** 1-2h
- **Origem:** A11y BLOCKER 1.2

### 🟡 A11Y-03 — PhotoUploadZone drag-drop com teclado
- [ ] Adicionar handlers ArrowUp/ArrowDown para reordenar
- [ ] `aria-grabbed`, `aria-dropeffect`
- **Arquivo:** `frontend/src/components/photos/PhotoUploadZone.tsx:188-295`
- **Tempo:** 2-3h
- **Origem:** A11y BLOCKER 1.3

### 🟡 A11Y-04 — Contraste insuficiente
- [ ] Atual: `#880e4f` em `#f48fb1` = 3.2:1
- [ ] Necessario: 4.5:1
- [ ] Escurecer texto ou remover opacidades < 60%
- [ ] Afeta: `BottomNav`, filtros do `CatalogBrowser`
- **Tempo:** 1-2h
- **Origem:** A11y SERIOUS 2.1

### 🟡 A11Y-05 — Adicionar `focus-visible` em todos os interativos
- [ ] Cards, botoes, links
- [ ] `focus-visible:outline focus-visible:outline-2`
- **Tempo:** 2-3h
- **Origem:** A11y SERIOUS 2.2

### 🟡 TEST-01 — Testes unitarios `AuthService`
- [ ] Login email valido + senha correta
- [ ] Login email valido + senha errada
- [ ] Login email inexistente
- [ ] Email em maiusculas (normalizacao)
- [ ] Roundtrip `hashPassword()` + `authenticate()`
- [ ] Usar `BCryptPasswordEncoder(4)` em testes pra agilizar
- **Tempo:** 2h
- **Origem:** QA C4

### 🟡 TEST-02 — Testes unitarios `PhotoService`
- [ ] Upload com Content-Type `image/jpeg` mas bytes PDF → rejeitar
- [ ] Upload da 4a foto → `PhotoLimitExceededException`
- [ ] Upload de arquivo vazio → `InvalidFileException`
- [ ] WebP valido → aceitar
- [ ] `entityType` invalido → rejeitar
- [ ] `sanitizeFilename` com `../../etc/passwd`
- **Tempo:** 3-4h
- **Origem:** QA C1

### 🟡 TEST-03 — Testes unitarios `middleware.ts`
- [ ] `/` sem cookie → redirect `/login`
- [ ] `/login` com cookie → redirect `/`
- [ ] `/api/auth/login` sem cookie → passa
- [ ] `/api/health` sem cookie → passa
- [ ] `/products/abc` sem cookie → redirect `/login`
- **Tempo:** 2h
- **Origem:** QA C5

### 🟡 TEST-04 — Adicionar `mvn test` ao pre-commit hook
- [ ] Editar `.husky/pre-commit`
- [ ] Adicionar `./mvnw test -q`
- **Tempo:** 30 min
- **Origem:** QA R5

---

## Sprint 4 — Evolucao

### 🟡 PERF-09 — Cursor pagination em produtos
- [ ] Indice `idx_product_active_name_id` ja existe!
- [ ] Adicionar params `lastSeenName` + `lastSeenId` em `/api/products`
- [ ] `WHERE (p.name, p.id) > (:lastName, :lastId)`
- **Tempo:** 4h
- **Origem:** DB#5, Architecture (recomendacao)

### 🟡 ARCH-09 — Eliminar proxy catch-all do Next.js
- [ ] Avaliar expor backend via Traefik diretamente em `/api/*`
- [ ] Middleware Traefik valida cookie/JWT
- [ ] Elimina latencia + memoria de uploads
- **Tempo:** 1 dia
- **Origem:** Architecture P2.1

### 🟡 ARCH-10 — Separar package `photo/` em `photo/` + `storage/`
- [ ] Mover `MinioStorageService`, `MinioHealthIndicator` para `storage/`
- [ ] Manter `photo/` so com entidade + servico de dominio
- **Tempo:** 2h
- **Origem:** Architecture P2.2

### 🟡 ARCH-11 — Decidir soft vs hard delete para `ProductTag`
- [ ] Hoje: ProductTag e hard delete, ProductLocation e soft. Inconsistente.
- [ ] Padronizar (recomendacao: tudo soft)
- **Tempo:** 2-3h
- **Origem:** Architecture D-10

### 🟡 ARCH-12 — Documentar decisoes via ADRs
- [ ] Photo polimorfica (sem FK) — decisao consciente
- [ ] Hierarquia de 3 niveis fixa (sem sub-locais)
- [ ] Frontend como gate de auth (apos SEC-05 vai mudar)
- [ ] Sem versionamento de API
- **Tempo:** 3-4h
- **Origem:** Architecture (multiplas referencias)

### 🟡 TEST-05 — E2E Playwright (4-6 fluxos criticos)
- [ ] Login → home
- [ ] Criar comodo → criar local → criar produto com foto
- [ ] Buscar produto na pagina de busca
- [ ] Excluir produto + verificar cascade
- **Tempo:** 1 dia
- **Origem:** QA D1

### 🟡 TEST-06 — Vitest para utils puros
- [ ] `highlight.ts`
- [ ] `fetchApi` (com `fetch` mockado)
- **Tempo:** 1-2h
- **Origem:** QA R2

### 🟡 TEST-07 — React Testing Library para `PhotoUploadZone`
- [ ] Upload PDF → erro
- [ ] Upload > 5MB → erro
- [ ] Upload 3 arquivos → todos slots
- [ ] 4o arquivo → erro de limite
- [ ] Botao remover → slot limpo
- [ ] Drag & drop entre slots
- **Tempo:** 3-4h
- **Origem:** QA R3

---

## Backlog ⚪ Baixa Prioridade

### Performance
- [ ] `default_batch_fetch_size: 50` em vez de 20
- [ ] `idx_photo_entity` adicionar `WHERE deleted_at IS NULL`
- [ ] Adicionar indice em `photo.object_key` para limpeza de orfaos

### Java/Spring
- [ ] `AppUser` usar `@PrePersist` para `createdAt` (consistencia)
- [ ] `Tag` adicionar `updated_at`
- [ ] `PhotoLimitExceededException` retornar 422 em vez de 400
- [ ] `AppUser.password` adicionar `@JsonIgnore`

### Frontend
- [ ] Substituir `<a href="/search">` por `<Link>` em search/page.tsx
- [ ] Remover `console.log(email)` do server
- [ ] Adicionar timeout no proxy fetch (slowloris)
- [ ] `key={index}` em listas reordenaveis (PhotoUploadZone) → usar id estavel
- [ ] Cleanup de intervals quando componente desmonta durante upload
- [ ] `deletePhoto` mostrar erro em vez de fire-and-forget

### Acessibilidade (resto dos 29 issues)
- [ ] Toast pause no hover/focus
- [ ] FAB mais longe da borda (`right-6 bottom-24`)
- [ ] Inconsistencia button vs Link nos cards de room/location
- [ ] Placeholders de icone com `aria-label` descritivo
- [ ] Modal/dialog patterns
- [ ] Spinner com `aria-live`

### Seguranca (defesa em profundidade)
- [ ] HSTS no backend
- [ ] `__Secure-` prefix no cookie em prod
- [ ] `sameSite: 'strict'` em vez de `'lax'`
- [ ] CSP no Next.js (depois de SEC-09)
- [ ] Validar `X-Request-Id` formato UUID
- [ ] Remover `highlightHtml()` dead code (risco XSS latente)
- [ ] `application-dev.yml` remover `org.hibernate.orm.jdbc.bind: TRACE`
- [ ] Reduzir presigned URL TTL de 60min para 5-15min
- [ ] Race condition no upload (TOCTOU): adicionar lock pessimista

### Database
- [ ] `AppUser` migrar para UUID v7
- [ ] `Tag` adicionar `updated_at`
- [ ] `VARCHAR(255)` → `TEXT` em `app_user.email`
- [ ] `NUMERIC` → `BIGINT` em `uuid_generate_v7()`
- [ ] `ON DELETE CASCADE` → `ON DELETE RESTRICT` em `product_location` (consistencia com soft-delete)

---

## Resumo Executivo

| Sprint | Foco | Itens | Tempo estimado |
|---|---|---|---|
| **Sprint 0** | Seguranca critica (BLOQUEADOR) | 8 | ~3 dias |
| **Sprint 1** | Performance + quick wins | 11 | ~4 dias |
| **Sprint 2** | Auth, contratos, estrutura | 12 | ~5 dias |
| **Sprint 3** | Resilience, A11y, testes | 15 | ~6 dias |
| **Sprint 4** | Evolucao | 7 | ~5 dias |
| **Backlog** | Baixa prioridade | ~30 | conforme tempo |

**Total:** ~60 tarefas executaveis, ~3-4 semanas de trabalho focado.

**Veredito:** Como catalogo pessoal para 2-3 pessoas, esta mais que adequado. Mas existem **3 bloqueadores de seguranca** no Sprint 0 (cookie forjavel, senhas no Git, backend sem auth) que precisam ser resolvidos imediatamente. Tudo o mais e divida tecnica gerenciavel — nada exige reescrita.

---

**Origem dos achados:**
- Java/Spring Boot reviewer (everything-claude-code:java-reviewer)
- TypeScript/Next.js reviewer (everything-claude-code:typescript-reviewer)
- Database reviewer (everything-claude-code:database-reviewer)
- Security reviewer (everything-claude-code:security-reviewer)
- Architect reviewer (voltagent-qa-sec:architect-reviewer)
- Performance engineer (voltagent-qa-sec:performance-engineer)
- Accessibility tester (voltagent-qa-sec:accessibility-tester)
- Penetration tester (voltagent-qa-sec:penetration-tester)
- QA expert (voltagent-qa-sec:qa-expert)

Data do review: 2026-04-06
