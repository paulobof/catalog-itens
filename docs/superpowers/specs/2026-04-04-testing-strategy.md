# Catalog Itens — Estratégia de Testes

> Seção complementar ao PRD & Design Spec (`2026-04-04-catalog-itens-design.md`).
> Deve ser implementada em paralelo com o desenvolvimento — não após.

---

## 1. Visão Geral e Metas de Cobertura

| Camada | Ferramenta Principal | Meta de Cobertura | Prioridade |
|---|---|---|---|
| Unidade (backend) | JUnit 5 + Mockito | >= 85% por serviço | Alta |
| Integração (backend) | Testcontainers (PostgreSQL + MinIO) | 100% dos fluxos críticos | Alta |
| API (contrato) | MockMvc + RestAssured | 100% dos endpoints | Alta |
| Componente (frontend) | React Testing Library | >= 80% dos componentes | Média |
| E2E | Playwright | 100% dos fluxos críticos de usuário | Alta |
| Performance | k6 | Baseline definida | Baixa (pós-MVP) |

Cobertura geral mínima aceitável para release: **85% backend, 75% frontend**.
Zero defeitos críticos em produção é o critério de saída obrigatório.
---

## 2. Testes Unitários (Backend)

### Dependências Maven

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <!-- inclui JUnit 5, Mockito, AssertJ, Hamcrest -->
  <scope>test</scope>
</dependency>
```

### Convenções Gerais

- Classe de teste espelha a classe de produção: `RoomService` -> `RoomServiceTest`
- Nomenclatura de método: `methodName_scenario_expectedResult` (ex: `createRoom_withBlankName_throwsValidationException`)
- Sem dependências de infraestrutura — toda dependência externa é mockada via Mockito
- Arrange / Act / Assert (AAA) separados por linha em branco

---

### 2.1 RoomService

| # | Método | Cenário | Resultado Esperado |
|---|---|---|---|
| R-U-01 | `createRoom` | name válido, description ausente | Room salva, `deleted_at` null, UUID gerado |
| R-U-02 | `createRoom` | name em branco | Lança `ConstraintViolationException` antes de chamar repository |
| R-U-03 | `createRoom` | name com 100 chars (limite exato) | Salva com sucesso |
| R-U-04 | `createRoom` | name com 101 chars | Lança exceção de validação |
| R-U-05 | `getRoomById` | ID existente e ativo | Retorna DTO com contagem de locais |
| R-U-06 | `getRoomById` | ID com `deleted_at` preenchido | Lança `ResourceNotFoundException` |
| R-U-07 | `getRoomById` | UUID inexistente | Lança `ResourceNotFoundException` |
| R-U-08 | `updateRoom` | name e description novos | Atualiza; `updated_at` renovado |
| R-U-09 | `deleteRoom` | Room ativa sem locais | Preenche `deleted_at`; não deleta fisicamente |
| R-U-10 | `deleteRoom` | Room com locais ativos | Soft-deleta room E cascateia para todas as locations filhas e seus ProductLocations |
| R-U-11 | `deleteRoom` | Room já deletada | Lança `ResourceNotFoundException` |
| R-U-12 | `listRooms` | Mix de ativas e deletadas | Retorna apenas as ativas |

**Caso crítico R-U-10 — verificações Mockito obrigatórias:**

```java
// dado: Room com 3 Locations, cada Location com 2 ProductLocations
verify(locationRepository).saveAll(argThat(list -> list.size() == 3 &&
    list.stream().allMatch(l -> l.getDeletedAt() != null)));
verify(productLocationRepository).saveAll(argThat(list -> list.size() == 6 &&
    list.stream().allMatch(pl -> pl.getDeletedAt() != null)));
// produtos NÃO devem ser tocados:
verify(productRepository, never()).save(any());
```
---

### 2.2 LocationService

| # | Método | Cenário | Resultado Esperado |
|---|---|---|---|
| L-U-01 | `createLocation` | Room ativa existente, name válido | Location criada com `room_id` correto |
| L-U-02 | `createLocation` | `room_id` de room deletada | Lança `ResourceNotFoundException` |
| L-U-03 | `createLocation` | `room_id` inexistente | Lança `ResourceNotFoundException` |
| L-U-04 | `deleteLocation` | Location com produtos vinculados | Soft-deleta location e todos os `ProductLocation`; produtos permanecem ativos |
| L-U-05 | `deleteLocation` | Location sem produtos | Soft-deleta somente a location |
| L-U-06 | `getLocationById` | Inclui produtos com quantidade | DTO retorna lista de `ProductLocationDTO` com `quantity` correto |
| L-U-07 | `getLocationsByRoom` | Room com mix ativas/deletadas | Retorna apenas ativas |

---

### 2.3 ProductService

| # | Método | Cenário | Resultado Esperado |
|---|---|---|---|
| P-U-01 | `createProduct` | Campos válidos sem locations e tags | Produto criado, listas vazias |
| P-U-02 | `createProduct` | Com 3 locations e quantities distintas | `ProductLocation` criado para cada; UNIQUE constraint não violada |
| P-U-03 | `createProduct` | Mesma location duas vezes no payload | Lança exceção de duplicidade antes de persistir |
| P-U-04 | `createProduct` | Location deletada no payload | Lança `ResourceNotFoundException` |
| P-U-05 | `createProduct` | Com tags existentes | `ProductTag` criado para cada |
| P-U-06 | `createProduct` | Com tag inexistente | Lança `ResourceNotFoundException` |
| P-U-07 | `updateProduct` | Substituição total de locations | Remove `ProductLocation` antigos, insere novos |
| P-U-08 | `updateProduct` | Substituição total de tags | Remove `ProductTag` antigos, insere novos |
| P-U-09 | `updateProduct` | Quantidade atualizada para location já vinculada | Atualiza `quantity` no `ProductLocation` existente |
| P-U-10 | `deleteProduct` | Produto com locations e tags | Soft-deleta produto; soft-deleta `ProductLocation`; `ProductTag` hard-deleted (junção simples) |
| P-U-11 | `getProductById` | Produto ativo | DTO inclui locais, tags, fotos ordenadas por `sort_order` |
| P-U-12 | `addLocationToProduct` | Quantity = 0 | Lança `ValidationException` |
| P-U-13 | `addLocationToProduct` | Quantity = Integer.MAX_VALUE | Aceita sem erro |
| P-U-14 | `getTotalQuantity` | Produto em 3 locais (2 + 5 + 1) | Retorna 8 |

---

### 2.4 TagService

| # | Método | Cenário | Resultado Esperado |
|---|---|---|---|
| T-U-01 | `createTag` | Name único, cor hex válida | Tag criada |
| T-U-02 | `createTag` | Name duplicado (case-insensitive) | Lança `ConflictException` (409) |
| T-U-03 | `createTag` | Color inválida (`#gggggg`, `pink`, ``) | Lança `ValidationException` |
| T-U-04 | `createTag` | Color null | Aceita (opcional) |
| T-U-05 | `createTag` | Name com 50 chars (limite exato) | Salva com sucesso |
| T-U-06 | `createTag` | Name com 51 chars | Lança exceção de validação |
| T-U-07 | `deleteTag` | Tag vinculada a produtos ativos | Soft-deleta tag; remove `ProductTag` |
| T-U-08 | `deleteTag` | Tag inexistente | Lança `ResourceNotFoundException` |
| T-U-09 | `listTags` | Mix de ativas e deletadas | Retorna apenas ativas |
---

### 2.5 PhotoService

PhotoService e o servico mais critico: limite de 3 fotos, dependencia com MinIO, consistencia banco+storage.

| # | Metodo | Cenario | Resultado Esperado |
|---|---|---|---|
| PH-U-01 | `uploadPhoto` | entity com 0 fotos, JPEG valido | Chama StorageService.upload(); persiste Photo com sort_order=0 |
| PH-U-02 | `uploadPhoto` | entity com 1 foto existente | sort_order=1 |
| PH-U-03 | `uploadPhoto` | entity com 2 fotos existentes | sort_order=2 |
| PH-U-04 | `uploadPhoto` | entity com 3 fotos (limite) | Lanca `PhotoLimitExceededException` SEM chamar StorageService |
| PH-U-05 | `uploadPhoto` | entity_type invalido | Lanca `ValidationException` |
| PH-U-06 | `uploadPhoto` | entity_id de produto deletado | Lanca `ResourceNotFoundException` |
| PH-U-07 | `uploadPhoto` | arquivo com 0 bytes | Lanca `ValidationException` antes de chamar storage |
| PH-U-08 | `uploadPhoto` | arquivo PDF | Lanca `InvalidFileTypeException` |
| PH-U-09 | `deletePhoto` | foto existente | Chama `StorageService.delete(key)`; preenche `deleted_at` |
| PH-U-10 | `deletePhoto` | StorageService.delete() lanca excecao | Transacao revertida; `deleted_at` NAO preenchido |
| PH-U-11 | `deletePhoto` | foto inexistente ou ja deletada | Lanca `ResourceNotFoundException` |
| PH-U-12 | `countActivePhotos` | Mix de fotos ativas e deletadas | Conta apenas com `deleted_at IS NULL` |

**Assert obrigatorio para PH-U-04 - o count deve ocorrer ANTES de chamar o storage:**

```java
verify(storageService, never()).upload(any(), any(), any());
```

---

### 2.6 SearchService

| # | Metodo | Cenario | Resultado Esperado |
|---|---|---|---|
| S-U-01 | `search` | query sem filtros | ILIKE em name e description |
| S-U-02 | `search` | query vazia, sem filtros | Todos os produtos ativos paginados |
| S-U-03 | `search` | com room_id valido | Filtrado por room via JOIN Location -> Room |
| S-U-04 | `search` | com tag_id valido | Filtrado via JOIN ProductTag |
| S-U-05 | `search` | query + room + tag | Todos os filtros com AND |
| S-U-06 | `search` | query com caracteres SQL especiais | Parametrizacao JPA bloqueia injecao |
| S-U-07 | `search` | Produto com `deleted_at` preenchido | Excluido dos resultados |
| S-U-08 | `search` | room_id inexistente | Retorna lista vazia (nao lanca excecao) |
---

## 3. Testes de Integracao (Backend - Testcontainers)

### Configuracao da Classe Base

```java
// IntegrationTestBase.java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public abstract class IntegrationTestBase {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("catalog_test")
        .withUsername("test")
        .withPassword("test");

    @Container
    static GenericContainer<?> minio = new GenericContainer<>("minio/minio:latest")
        .withCommand("server /data --console-address :9001")
        .withExposedPorts(9000, 9001)
        .withEnv("MINIO_ROOT_USER", "minioadmin")
        .withEnv("MINIO_ROOT_PASSWORD", "minioadmin");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("app.storage.minio.endpoint", () ->
            "http://" + minio.getHost() + ":" + minio.getMappedPort(9000));
    }
}
```

Flyway roda automaticamente ao subir o contexto Spring. O schema real e validado - sem H2 nem schema falso.

---

### 3.1 Fluxo Room -> Location -> Product

| # | Fluxo | Verificacao no Banco |
|---|---|---|
| I-01 | Criar Room -> Location -> Product | FKs presentes; deleted_at null; UNIQUE(product_id, location_id) nao violada |
| I-02 | Soft-delete Room -> cascata | rooms.deleted_at preenchido; locations.deleted_at preenchido; product_locations.deleted_at preenchido; products intactos |
| I-03 | Soft-delete Location -> parcialidade | Apenas location e seus product_locations afetados; product e outras locations intactos |
| I-04 | Product em 3 Locations -> checar soma | SUM(quantity) correto; 3 registros em product_locations |
| I-05 | Inserir mesmo (product_id, location_id) duas vezes | PostgreSQL lanca violacao de UNIQUE; transacao revertida |

---

### 3.2 Foto com MinIO Real

| # | Fluxo | Verificacao |
|---|---|---|
| I-06 | Upload JPEG 200KB para produto | Objeto existe no bucket; URL no banco; sort_order=0 |
| I-07 | Upload segunda foto | sort_order=1; ambas no MinIO |
| I-08 | Upload terceira foto | sort_order=2; tres fotos no MinIO |
| I-09 | Tentativa de upload quarta foto | HTTP 400; nenhum novo objeto no MinIO; count permanece 3 |
| I-10 | Delete de foto | deleted_at preenchido no banco; objeto removido do bucket |
| I-11 | Delete com MinIO indisponivel (container parado) | Transacao revertida; banco nao atualizado; HTTP 500 |
| I-12 | Upload para location (entity_type=location) | Funciona identico ao produto |
| I-13 | Fotos soft-deletadas nao contam para o limite | Apos deletar 2 de 3, novo upload aceito; total = 2 ativas + 2 deletadas |

---

### 3.3 Search com PostgreSQL Real

| # | Query | Resultado Esperado |
|---|---|---|
| I-14 | ?q=meia | Produto Meias de algodao encontrado; case-insensitive |
| I-15 | ?q=MEIA | Mesmo resultado que I-14 |
| I-16 | ?q=meia&room={quartoId} | Apenas meias armazenadas no quarto |
| I-17 | ?q=&tag={roupaId} | Todos os produtos com tag roupa |
| I-18 | ?q=x DROP TABLE products | Zero resultados; tabela intacta (parametrizacao JPA) |
| I-19 | ?q= com 50 produtos no banco | Pagina 0 com 20 itens; totalElements=50; totalPages=3 |
| I-20 | Produto com deleted_at preenchido | Excluido dos resultados de busca |
---

## 4. Testes de API (MockMvc)

```java
@WebMvcTest(RoomController.class)
@Import(GlobalExceptionHandler.class)
class RoomControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean RoomService roomService;
}
```

---

### 4.1 Rooms API

| # | Request | Esperado |
|---|---|---|
| A-R-01 | GET /api/rooms | 200 + array com id, name, description, locationCount |
| A-R-02 | POST /api/rooms com name valido | 201 + id UUID gerado |
| A-R-03 | POST /api/rooms com name vazio | 400 + body com message |
| A-R-04 | POST /api/rooms sem name | 400 |
| A-R-05 | GET /api/rooms/{id} ID valido | 200 + DTO com lista de locations |
| A-R-06 | GET /api/rooms/{id} ID inexistente | 404 + body padronizado com requestId |
| A-R-07 | PUT /api/rooms/{id} name valido | 200 + DTO atualizado |
| A-R-08 | DELETE /api/rooms/{id} | 204 sem body |
| A-R-09 | DELETE /api/rooms/{id} ja deletado | 404 |
| A-R-10 | Qualquer endpoint com UUID malformado | 400 (nunca 500) |

**Formato de erro obrigatorio em todos os 4xx/5xx:**

```json
{
  "timestamp": "2026-04-04T13:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Room not found with id: abc-123",
  "path": "/api/rooms/abc-123",
  "requestId": "req-xyz-789"
}
```

---

### 4.2 Locations API

| # | Request | Esperado |
|---|---|---|
| A-L-01 | GET /api/rooms/{roomId}/locations room ativa | 200 + array com productCount |
| A-L-02 | GET /api/rooms/{roomId}/locations room deletada | 404 |
| A-L-03 | POST /api/rooms/{roomId}/locations | 201 + DTO com roomId |
| A-L-04 | GET /api/locations/{id} | 200 + DTO com products[] com quantity |
| A-L-05 | DELETE /api/locations/{id} com produtos | 204; products permanecem acessiveis |

---

### 4.3 Products API

| # | Request | Esperado |
|---|---|---|
| A-P-01 | GET /api/products?page=0&size=10 | 200 + { content, page, size, totalElements, totalPages } |
| A-P-02 | GET /api/products?q=sabao | 200 + produtos com sabao em name/description |
| A-P-03 | GET /api/products?room={id}&tag={id} | 200 + filtros combinados |
| A-P-04 | POST /api/products payload completo | 201 + DTO com locations e tags |
| A-P-05 | POST /api/products name com 150 chars | 201 (limite aceito) |
| A-P-06 | POST /api/products name com 151 chars | 400 |
| A-P-07 | PUT /api/products/{id} troca de locations | 200 + locations atualizadas |
| A-P-08 | DELETE /api/products/{id} | 204 |

---

### 4.4 Photos API

| # | Request | Esperado |
|---|---|---|
| A-PH-01 | POST /api/photos/upload multipart JPEG | 201 + { id, url, sortOrder } |
| A-PH-02 | POST /api/photos/upload 4a foto para mesma entity | 400 + mensagem sobre limite |
| A-PH-03 | POST /api/photos/upload sem entityType | 400 |
| A-PH-04 | POST /api/photos/upload sem arquivo | 400 |
| A-PH-05 | DELETE /api/photos/{id} | 204 |
| A-PH-06 | DELETE /api/photos/{id} ID inexistente | 404 |

---

### 4.5 Search API

| # | Request | Esperado |
|---|---|---|
| A-S-01 | GET /api/search?q=bala | 200 + paginacao + produtos correspondentes |
| A-S-02 | GET /api/search sem parametros | 200 + todos os produtos ativos paginados |
| A-S-03 | GET /api/search?q=x&room={inexistente} | 200 + lista vazia (nao 404) |
| A-S-04 | GET /api/search?q=test&size=5&page=1 | 200 + paginacao correta |

---

### 4.6 Headers e Observabilidade

| # | Cenario | Verificacao |
|---|---|---|
| A-O-01 | Request com X-Request-Id: abc-123 | Response contem o mesmo header; MDC inclui o ID |
| A-O-02 | Request sem X-Request-Id | Backend gera UUID e inclui no response |
| A-O-03 | GET /actuator/health | 200 + status UP |
| A-O-04 | GET /actuator/health com MinIO down | 200 + status DOWN com minio DOWN |
---

## 5. Testes de Componente (Frontend)

### Configuracao

```bash
npm install --save-dev @testing-library/react @testing-library/user-event @testing-library/jest-dom jest jest-environment-jsdom msw
```

Usar MSW (Mock Service Worker) para interceptar chamadas HTTP - evita dependencia do backend real.

---

### 5.1 Componentes de Alta Prioridade

**RoomCard**
- Renderiza nome e contagem de locais/itens
- Clique navega para /rooms/[id]
- Com foto: thumbnail; sem foto: icone placeholder
- Nome com 100 chars nao quebra layout (overflow ellipsis)

**ProductCard**
- Renderiza thumbnail da primeira foto (sort_order=0)
- Sem fotos: placeholder visual visivel
- Tags renderizadas com cor de fundo correta (hex string do backend)
- Clique navega para /products/[id]

**PhotoCarousel**
- Com 1 foto: dots indicator nao renderizado
- Com 3 fotos: 3 dots; dot ativo muda ao clique
- Botao de deletar chama DELETE e remove foto do estado local
- Apos delete de 1 foto de 3: botao de upload reativado
- Com 3 fotos: botao de upload desabilitado

**ProductForm**
- Submit com name vazio: mensagem de validacao visivel; API nao chamada
- Upload de foto exibe preview imediatamente (FileReader API)
- Ao atingir 3 fotos: input de upload desabilitado
- Autocomplete de tag: digitar parcial filtra a lista
- Criar tag inline: formulario aparece; apos criar, tag selecionada
- Location com quantity: campo defaulta para 1; aceita apenas inteiros >= 1
- Mesma location nao pode ser adicionada duas vezes

**SearchPage**
- Debounce: API chamada apos 300ms de inatividade (nao a cada keystroke)
- Dropdown de room filtra resultados ao mudar selecao
- Multi-select de tags: adicionar/remover atualiza query
- Estado vazio: mensagem amigavel quando sem resultados
- Loading state: skeleton cards exibidos durante fetch

**BottomNavigation**
- Aba ativa tem destaque visual
- Clique em cada aba navega para rota correta
- Renderizado em todas as paginas principais

---

### 5.2 Testes de Acessibilidade (jest-axe)

```typescript
import { axe, toHaveNoViolations } from "jest-axe"
expect.extend(toHaveNoViolations)

it("ProductForm has no accessibility violations", async () => {
  const { container } = render(<ProductForm />)
  expect(await axe(container)).toHaveNoViolations()
})
```

Executar em: ProductForm, SearchPage, PhotoCarousel, RoomCard, BottomNavigation.

Focos obrigatorios: labels em inputs, alt em imagens, contraste adequado (accent #f48fb1 NAO para texto), focus ring visivel.
---

## 6. Testes E2E (Playwright)

### Configuracao

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 7"] } },
  ],
})
```

Os testes E2E sobem o stack completo via Docker Compose. Banco limpo antes de cada suite:

```sql
TRUNCATE product_tag, product_location, photos, products, tags, locations, rooms CASCADE;
```

---

### 6.1 E2E-01: Ciclo Completo de Criacao

Passos:
1. Acessa /
2. Clica FAB -> cria Room Sala de Estar
3. Clica na room -> /rooms/{id}
4. Clica FAB -> cria Location Estante
5. Clica na location -> /locations/{id}
6. Clica FAB -> abre ProductForm
7. Preenche name Livro de receitas, description Cozinha
8. Upload de foto JPG
9. Seleciona location Estante, quantity 1
10. Cria tag livros inline com cor #ff69b4
11. Submete formulario
12. Redireciona para /products/{id}
13. Verifica: titulo, foto, badge livros, badge Estante x1

---

### 6.2 E2E-02: Busca com Filtros

Passos:
1. Seed: 2 rooms, 3 produtos distribuidos
2. Acessa /search
3. Digita camis -> aguarda debounce 300ms
4. Verifica Camiseta azul no resultado
5. Seleciona filtro room Quarto
6. Verifica apenas produtos do Quarto
7. Adiciona filtro tag roupas -> combinacao AND
8. Limpa filtros -> todos os produtos voltam

---

### 6.3 E2E-03: Limite de 3 Fotos

Passos:
1. Produto existente com 0 fotos
2. Upload foto 1 -> preview; contagem 1/3
3. Upload foto 2 -> preview; contagem 2/3
4. Upload foto 3 -> preview; contagem 3/3
5. Botao de upload fica disabled
6. Drag-and-drop de quarta foto -> ignorado ou mensagem de erro
7. Deleta foto 2 via botao de remover
8. Botao de upload reativado; contagem 2/3
9. Upload nova foto -> aceito; 3/3

---

### 6.4 E2E-04: Soft Delete em Cascata (UI)

Passos:
1. Seed: Room -> Location -> Product
2. Acessa /rooms/{id}
3. Clica Deletar comodo -> confirma dialog
4. Redireciona para /
5. Room nao aparece na lista
6. /locations/{locationId} -> estado nao encontrado
7. /products/{productId} -> produto ainda existe
8. Badge da location deletada nao aparece no produto

---

### 6.5 E2E-05: Navegacao Mobile (Pixel 7)

Passos:
1. Viewport Pixel 7 (412x915)
2. Bottom navigation visivel e funcional
3. FAB acima do bottom nav sem sobrepor conteudo
4. Cards em coluna unica
5. Upload de foto funcionando em touch
6. Carousel navegavel por swipe horizontal
7. Sem overflow horizontal de texto

---

### 6.6 E2E-06: Produto em Multiplos Locais

Passos:
1. Produto com 3 locations (qty: 1, 3, 2)
2. /products/{id}: secao Armazenado em mostra 3 badges
3. Quantidade total = 6
4. Cada location exibe o produto com sua quantity correta

---

### 6.7 E2E-07: Tag Duplicada Bloqueada

Passos:
1. Cria tag frutas
2. Tenta criar frutas novamente
3. Erro amigavel: Tag frutas ja existe (nao stack trace)
4. Listagem sem duplicata
---

## 7. Estrategia de Dados de Teste

### Principios

- **Isolamento total**: cada teste cria seus proprios dados e limpa ao final
- **Nomes descritivos**: ex. Produto-teste-limite-fotos identifica o cenario de imediato
- **Sem dependencia de ordem**: nenhum teste pode depender de outro ter rodado antes
- **Fixtures tipadas**: TypeScript para E2E, Java builder para integracao

### Builder Pattern (Testes de Integracao)

```java
// TestDataBuilder.java
public class TestDataBuilder {
    public static Room.RoomBuilder aRoom() {
        return Room.builder()
            .id(UUID.randomUUID())
            .name(Room- + UUID.randomUUID().toString().substring(0, 8))
            .createdAt(LocalDateTime.now());
    }
    public static Room.RoomBuilder aDeletedRoom() {
        return aRoom().deletedAt(LocalDateTime.now().minusDays(1));
    }
    public static Photo.PhotoBuilder aPhotoFor(UUID entityId, String entityType, int sortOrder) {
        return Photo.builder()
            .id(UUID.randomUUID())
            .entityId(entityId)
            .entityType(entityType)
            .objectKey(photos/ + entityType + / + entityId + / + UUID.randomUUID() + .jpg)
            .sortOrder(sortOrder);
    }
}
```

### Dados de Fronteira Obrigatorios

| Campo | Minimo Valido | Maximo Valido | Invalidos a Testar |
|---|---|---|---|
| Room.name | 1 char | 100 chars | vazio, 101 chars, null |
| Location.name | 1 char | 100 chars | vazio, 101 chars, null |
| Product.name | 1 char | 150 chars | vazio, 151 chars, null |
| Tag.name | 1 char | 50 chars | vazio, 51 chars, duplicado |
| Tag.color | #000000 | #ffffff | #ggg, pink, #fff (5 chars) |
| ProductLocation.quantity | 1 | 99999 | 0, -1, null |
| Fotos por entity | 0 | 3 | 4 (deve ser rejeitado) |
---

## 8. Performance Baseline (pos-MVP)

Ferramenta: k6. Dados representativos: 1000 produtos, 50 rooms, 100 locations, 5 tags.

| Endpoint | P95 | P99 | RPS Alvo |
|---|---|---|---|
| GET /api/products (lista paginada) | < 200ms | < 500ms | 20 |
| GET /api/search?q=... | < 300ms | < 800ms | 10 |
| POST /api/photos/upload (JPEG 500KB) | < 2000ms | < 5000ms | 2 |
| GET /api/rooms | < 100ms | < 200ms | 30 |
| GET /api/products/{id} (com fotos e tags) | < 150ms | < 400ms | 20 |
---

## 9. Pipeline CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  backend-unit:
    name: Backend - Unit Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: 21, distribution: temurin }
      - run: ./mvnw test -Dtest=*ServiceTest -DfailIfNoTests=false
      - uses: actions/upload-artifact@v4
        with:
          name: unit-test-report
          path: backend/target/surefire-reports/

  backend-integration:
    name: Backend - Integration Tests
    runs-on: ubuntu-latest
    needs: backend-unit
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: 21, distribution: temurin }
      - run: ./mvnw verify -Dtest=*IntegrationTest,*ControllerTest

  backend-coverage:
    name: Backend - Coverage Gate (JaCoCo)
    runs-on: ubuntu-latest
    needs: [backend-unit, backend-integration]
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: 21, distribution: temurin }
      - run: ./mvnw verify jacoco:report && ./mvnw jacoco:check

  frontend-unit:
    name: Frontend - Component Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci && npm test -- --coverage --watchAll=false

  e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    needs: [backend-integration, frontend-unit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - name: Start full stack
        run: docker compose -f docker-compose.yml -f docker-compose.test.yml up -d --wait
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
        working-directory: frontend
      - name: Run E2E
        run: npx playwright test --reporter=html
        working-directory: frontend
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: playwright-report, path: frontend/playwright-report/ }
      - name: Tear down
        if: always()
        run: docker compose down -v
```

---

### Quality Gates - Regras de Bloqueio de Merge

| Gate | Regra | Bloqueia Merge? |
|---|---|---|
| Cobertura de linha backend | >= 85% geral; >= 90% em PhotoService, ProductService, SearchService | Sim |
| Cobertura de branch backend | >= 80% | Sim |
| Cobertura frontend | >= 75% statements | Sim |
| Testes unitarios | 0 falhas | Sim |
| Testes de integracao | 0 falhas | Sim |
| E2E-01 a E2E-04 | 0 falhas | Sim |
| E2E-05 (mobile) | 0 falhas | Sim |
| Acessibilidade (jest-axe) | 0 violacoes criticas | Sim |
| Performance baseline | Alerta apenas | Nao (pos-MVP) |
---

## 10. JaCoCo - Configuracao de Cobertura Minima

```xml
<!-- pom.xml - dentro de build/plugins -->
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.12</version>
  <executions>
    <execution>
      <id>prepare-agent</id>
      <goals><goal>prepare-agent</goal></goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals><goal>report</goal></goals>
    </execution>
    <execution>
      <id>check</id>
      <goals><goal>check</goal></goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.85</minimum>
              </limit>
              <limit>
                <counter>BRANCH</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.80</minimum>
              </limit>
            </limits>
          </rule>
          <rule>
            <element>CLASS</element>
            <includes>
              <include>com.catalogitens.photo.PhotoService</include>
              <include>com.catalogitens.product.ProductService</include>
              <include>com.catalogitens.search.SearchService</include>
            </includes>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.90</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
        <excludes>
          <exclude>com/catalogitens/config/**</exclude>
          <exclude>**/*Application.class</exclude>
        </excludes>
      </configuration>
    </execution>
  </executions>
</plugin>
```
---

## 11. Priorizacao por Risco

Escrever estes testes ANTES de qualquer outra funcionalidade:

| Prioridade | Cenario | Risco se Nao Testado | Casos de Teste |
|---|---|---|---|
| 1 | Limite de 3 fotos | Arquivos orfaos no MinIO sem registro no banco | PH-U-04, I-09, E2E-03 |
| 2 | Cascata de soft delete Room->Location->ProductLocation | Dados fantasma aparecem na UI apos delecao do pai | R-U-10, I-02, E2E-04 |
| 3 | UNIQUE constraint ProductLocation | Duplicidade silenciosa gera contagem incorreta de estoque | I-05, P-U-03 |
| 4 | SQL injection em search | Vetor de seguranca mesmo em app pessoal | I-18, S-U-06 |
| 5 | Transacao revertida com MinIO falho | Banco e storage ficam inconsistentes | I-11, PH-U-10 |
| 6 | Soft delete nao vaza entidades deletadas | Queries sem deleted_at IS NULL expoe dados deletados | R-U-12, T-U-09, P-U-11 |
| 7 | Fotos soft-deletadas nao contam para o limite | Contagem errada permite ultrapassar 3 fotos | PH-U-12, I-13 |