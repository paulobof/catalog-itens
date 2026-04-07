# Notas de Arquitetura

Contexto e rationale das decisoes de implementacao que nao sao obvias pelo codigo.
Extraido dos comentarios removidos durante a limpeza do codigo.

---

## Backend — Seguranca

### `PhotoService` — Defesa contra decompression bomb

- `MAX_PIXELS = 50_000_000` (50 MP) dimensiona o pior caso: uma imagem nesse limite descompacta para ~200 MB em memoria, cabendo no heap de 768 MB.
- `validateDimensions()` usa `ImageReader` em modo lazy (so le o header) **antes** de carregar os pixels. Um PNG malicioso de 80 KB pode descompactar para 30 GB — so a leitura de `width/height` via `ImageInputStream` e segura contra isso.
- `JPEG_MAGIC` / `PNG_MAGIC` / `WEBP_MAGIC_*` sao verificados nos primeiros 12 bytes. Defesa em profundidade alem do `Content-Type` do cliente, que pode mentir.

### `AuthService` — Defesa contra timing attack

- `DUMMY_HASH` e um BCrypt hash pre-computado (cost 12) usado quando o email nao e encontrado. Rationale: BCrypt e intencionalmente lento; pular ele no "user not found" vazaria a existencia de contas via diferenca de tempo de resposta. Rodar `ENCODER.matches()` sempre (contra o hash real ou o dummy) normaliza a latencia e previne enumeracao de usuarios.
- O valor de `DUMMY_HASH` nao precisa ser secreto — e gerado uma vez e fica hardcoded.
- `hashPassword()` le `APP_AUTH_PEPPER` do env var com default `"pepper2"` para compatibilidade retroativa com senhas ja armazenadas no banco.

### `JwtAuthFilter` — Validacao JWT stateless

- Valida JWTs HS256 **emitidos pelo frontend Next.js** (em `/api/auth/login`), assinados com `SESSION_SECRET`, forwarded como `Authorization: Bearer <token>` em cada chamada proxied. O backend nunca emite tokens.
- Usa `constantTimeEquals()` para comparar assinaturas HMAC — previne side-channel timing attack na verificacao da assinatura.
- Se `app.auth.session-secret` estiver ausente ou < 32 chars, o filtro desabilita silenciosamente a auth JWT (log warning). Util para dev local mas **precisa falhar alto em prod**.

### `LoginRateLimiter` — Sliding window in-memory

- Limites por IP e por email, 5 tentativas em 15 min, lockout de 15 min apos exceder.
- Armazenamento em `ConcurrentHashMap` — nao sobrevive a restart e nao coordena entre instancias. Aceitavel para deploy single-node; migrar para Redis em HA.

---

## Backend — Fotos

### `ThumbnailService.generateThumbnailUrl()` retorna a URL DA ORIGINAL

- Apesar do nome, o metodo retorna URL presigned da **imagem original (2048 px max)**, nao do thumbnail 600 px.
- Rationale: o `<Image>` do Next.js otimiza server-side para o tamanho exato de cada device. Servir a 2048 px garante sharpness em telas retina (onde um "thumbnail" de 300 px seria borrado ao ser exibido a 200 CSS px em 3x DPR).
- O arquivo thumbnail de 600 px continua sendo gerado e armazenado — serve como fallback para clientes sem image optimizer.

### `PhotoService` — Cascade soft-delete

- Ordem do cascade em `RoomService.delete()`: `ProductLocations` (filtrados por room) → fotos de cada `Location` → `Locations` → fotos do `Room` → `Room`.
- Ordem importa: `findAllByRoomId(id)` precisa rodar **antes** das locations serem soft-deletadas, senao o `@SQLRestriction` filtraria elas fora do resultado.
- Todos os deletes vao por `deleteById()` que o Hibernate traduz via `@SQLDelete` em `UPDATE ... SET deleted_at = now()`.

### `ProductService` — Hard vs soft delete

- `ProductTags` sao **hard-deleted** (nao tem valor de auditoria — e so um link).
- `ProductLocations` e `Photos` sao **soft-deleted** (tem valor de auditoria/recovery).
- `addLocation()` checa existencia ativa manualmente antes de inserir e lanca `DataIntegrityViolationException` com mensagem clara. Ha um unique partial index no Postgres que tambem pegaria, mas essa checagem manual permite uma mensagem 409 amigavel orientando o cliente a usar `PUT` para atualizar quantity.

---

## Backend — Seeding de usuarios

### `UserSeeder` — Bootstrap idempotente via env vars

- Le `SEED_USER_{1,2}_EMAIL/PASSWORD/NAME` no startup.
- Cria usuarios que nao existem — **nunca atualiza**. Trocas de senha em producao vao via `PasswordHasherTool` + `UPDATE` manual.
- Env vars ausentes = no-op silencioso. Permite ambientes onde os usuarios sao gerenciados out-of-band.

### `PasswordHasherTool` — Helper standalone

- Roda **sem** contexto Spring (classpath minimo).
- Script wrapper: `./scripts/hash-password.sh <senha>`.
- Workflow de rotacao em prod: gerar hash → `UPDATE app_user SET password = '<hash>' WHERE email = '...'` direto no Postgres. Nao expoe senhas em nenhum endpoint.

---

## Frontend — Autenticacao e proxy

### `middleware.ts` — Gate de acesso

- Toda rota exceto allowlist exige JWT valido no cookie.
- **Paths publicos exatos:** `/login`, `/api/health`, `/manifest.webmanifest`.
- **Prefixos publicos:** `/api/auth/login`, `/api/auth/logout`.
- O matcher exclui `_next/static`, `_next/image`, `favicon.ico`, icons — assets estaticos passam direto.
- JWT e validado (assinatura + expiracao) em cada request via `verifySessionToken`.
- Falha de validacao → redirect para `/login`.
- Header `x-pathname` e setado em cada response pra server components downstream saberem a rota atual.

### `lib/auth/session.ts` — Configuracao JWT

- Biblioteca `jose` com HS256.
- Lifetime da sessao: 7 dias.
- `SESSION_SECRET` precisa ter pelo menos 32 chars — lanca erro no startup se nao tiver.
- Cookie: `catalog-session` (httpOnly, sameSite=lax, secure em prod).
- O JWT nao pode ser forjado sem o `SESSION_SECRET` — essa e a boundary de seguranca entre o Next.js trusted server e o browser do usuario.

### `app/api/auth/login/route.ts` — Emissao do token

- Proxy das credenciais para o backend Spring.
- Em caso de sucesso, cria JWT HS256 com `id`, `email`, `name`.
- Backend fetch tem timeout `AbortSignal.timeout(15_000)` — falha rapido e retorna HTTP 502 em outages.

### `app/api/[...path]/route.ts` — Proxy backend

- **Allowlist de paths:** apenas `products`, `rooms`, `locations`, `photos`, `tags`. Outros retornam 404 — impede que o browser alcance endpoints arbitrarios do backend (ex: actuator).
- Le o cookie `catalog-session` e re-injeta como `Authorization: Bearer <jwt>` no upstream. **O browser nunca envia o JWT diretamente** — so o cookie.
- So headers seguros sao forwarded (`content-type`, `accept`, `x-request-id` up; `content-type`, `cache-control`, `etag`, `last-modified`, `location` down).
- Timeout de 30s no upstream, `redirect: 'manual'` para o proxy nao seguir redirects.

### `lib/api/client.ts` — RSC vs CSR

- **Server-side (RSC, Server Actions):** usa `API_URL` (rede interna do Docker), le o cookie via `next/headers`, adiciona `Authorization: Bearer <jwt>` manualmente.
- **Client-side (browser):** usa URL relativa que vai pelo proxy `api/[...path]/route.ts`, que cuida do forwarding do JWT. O browser nao precisa adicionar header nenhum.
- Cada request tem `X-Request-Id` para correlacao de logs entre camadas.

---

## Frontend — Catalogo e navegacao

### `CatalogBrowser.tsx` — Estado via URL search params

- View (rooms / locations / products) e derivada **totalmente** de `?room=<id>&location=<id>`, nao de state local do React.
- `useEffect` keyed nos search params refaz o fetch quando a URL muda — entao **browser back/forward funciona corretamente**.
- Flag `cancelled` previne fetches stale de sobrescrever state apos navegacao.
- Search/filter text e local, reseta ao navegar entre niveis.

### `login/page.tsx` — Hard navigation apos login

- Usa `window.location.href = '/'` em vez de `router.push('/')`.
- Motivo: a hard navigation forca o middleware a re-executar com o cookie recem-setado. `router.push` pode nao disparar o middleware no path que estabelece o contexto autenticado.

### `ProductForm.tsx` — Hard navigation apos save

- Mesmo motivo do login: `window.location.href` apos salvar evita issues com intercepting routes (a pagina do form pode estar sendo exibida num modal context, e soft navigation nao dismissaria corretamente).

### `components/ui/Sheet.tsx` — Modal bottom-sheet

- Slide up from bottom (mobile-first).
- Fecha via `router.back()` (necessario pra dismissar intercepting routes e restaurar a pagina de background).
- Trava `document.body.style.overflow` enquanto aberto.
- Escape fecha.

---

## Frontend — Fotos

### `PhotoUploadZone.tsx` — Lifecycle de blob URLs

- Para cada `File` selecionado, chama `URL.createObjectURL(file)` pra renderizar preview e armazena a URL num `ref`.
- `useEffect` cleanup revoga todas as blob URLs quando slots mudam e ao unmount — previne memory leak.
- **Nao seta `Content-Type` manualmente** em uploads: o browser precisa auto-gerar o multipart boundary pra `FormData`.
- Limites: max 3 fotos, max 5 MB cada, formatos `image/jpeg|png|webp`.

---

## Frontend — Componentes diversos

### `components/ui/Toast.tsx` — Estado fora da arvore React

- Queue de toasts armazenada em state module-level (fora do React tree) com `Set<Listener>` pub/sub.
- Permite `showToast()` ser chamado de qualquer lugar (inclusive codigo nao-React) sem precisar de Context Provider.
- Componentes React subscrevem via `useEffect`.
- **Trade-off:** pode duplicar listeners em React Strict Mode.

### `components/ui/Badge.tsx` — Override de tipo

- Usa `Omit<HTMLAttributes<HTMLSpanElement>, 'color'>` porque o atributo HTML nativo `color` e tipado como `string`, conflitando com o prop `color: string | null` do componente.

### `lib/api/types.ts` — Contrato com o backend

- Interfaces TS mapeiam os DTOs Java do Spring Boot.
- Todas as datas sao ISO 8601 strings (Jackson serializa `TIMESTAMPTZ`).
- Todos os IDs sao UUID v7 strings.

---

## Deploy

### Topologia de redes Docker (validada)

```
dokploy-network (Traefik)  →  frontend
                              ↓
                              app-net  →  backend, minio, minio-init
                                          ↓
                                          db-net (internal: true)  →  db
```

- **`db-net` tem `internal: true`**: Postgres nao tem rota externa nenhuma. So backend alcanca.
- **Backend expoe 8080 apenas via `expose`** (nao via `ports:`). Nunca e alcancavel do host em producao.
- **Frontend e a unica entrada publica** via Traefik.

### `minio-init` — One-shot bootstrap

- Cria o bucket `catalog-photos` e o service account `catalogsvc` na primeira inicializacao.
- Roda com `condition: service_completed_successfully` pra garantir que o backend so sobe depois.
- Idempotente — `|| echo "...continuing"` absorve erros de "ja existe".
