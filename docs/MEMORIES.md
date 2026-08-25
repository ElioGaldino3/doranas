# Memórias do projeto

Memória durável: decisões, APIs mapeadas, gotchas e convenções.
Registre aqui toda informação nova e durável em vez de repetir no
`AGENTS.md`. Antes de investigar, confira se já consta aqui.

## Registros

### Migração v1→v2 + persistência (Fase 3) — 2026-08-25
- **Chave**: `dorama_graph_data` (v2 = `{schemaVersion:2, doramas, migrationPending?,
  lastError?, updatedAt}`). Backup v1 em `dorama_graph_backup_v1`.
- **`persistence.ts`**: `isV1Doc`/`isV2Doc` (v1 = sem schemaVersion + `nodes[]`;
  v2 = `schemaVersion===2` + `doramas[]`), `readV2Doc`/`writeV2Doc`/`backupV1`,
  `storage` injetável (interface `StorageLike`, default localStorage) p/ teste.
- **`migration.ts`**: `migrateIfNeeded({storage, fetchSeriesDetails,
  fetchSeriesCast, resolveSeriesQids, fetchWikidataCast, toTvImage?,
  onProgress?})`. Só para dorama v1. Pipeline por dorama: TMDB details+cast →
  resolve QID → cast Wikidata → `mergeCast`+`applyProtagonistHeuristic` →
  `DoramaRecord`. Persistência **progressiva** e **parcial** (`migrationPending`).
- **Gotchas importantes (evitar perda de dados)**:
  1. Nunca sobrescrever a chave v1 com um doc v2 vazio enquanto ainda há
     doramas a processar — `persistPartial` só roda com `done.length > 0`.
  2. Em falha de lote (ex.: quota no resolve/wikidata) **antes de processar
     nada**, retornar `migrated:false` sem persistir — chave v1 intacta p/
     retry.
  3. `migrated: true` só quando `done.length > 0` (algo foi migrado de fato).
  4. Backup criado **antes** de qualquer escrita.
- **`useAppInit.ts`**: hook React (roda no mount) que executa a migração real
  (TMDB+Wikidata reais) com progresso e povoa o `catalogStore`. **Ainda não
  montado na UI — conectar na Fase 4** (a UI legada usa a mesma chave e
  brigariam).
- **TMDB**: adicionado `getSeriesDetails` (`/tv/{id}` → title/ano/overview/poster).
- **Wikidata**: adicionado `fetchCastForQids` (lote **sequencial**, retry em
  429 com `retryAfterMs`, pacing 300ms) — resolve a pendência de pacing da
  Fase 1.

### Modelo v2 + derivações + catalogStore (Fase 2) — 2026-08-25
- **Modelo v2** (`src/types/models.ts`): `DoramaRecord` (id TMDB, título, ano,
  overview, poster, addedAt, wikidataId, cast), `CastMember` (personId, name,
  profileImgUrl, order, protagonist, wikidataId), `SCHEMA_VERSION = 2`,
  `DoramaDocument` (persistido na chave `dorama_graph_data`), `Screen`
  (navegação por telas trocáveis, sem router).
- **`PROTAGONIST_TOP_N = 3`**: protagonista = `order < topN` (billing 0-based,
  os N primeiros). Não marcar nunca `order == null` (atores só-Wikidata).
- **Derivações** (`src/utils/derivations.ts`), todas puras:
  - `applyProtagonistHeuristic(cast, topN)`
  - `tmdbCastToMembers(cast, toProfileUrl?)` — order = índice do billing.
  - `mergeCast(tmdb, wikidata)` — TMDB é base; enriquece `wikidataId` por
    casamento de `tmdbPersonId`; adiciona atores só-Wikidata com
    `order=null`, `personId=QID`. **Não muta inputs** (clona). Dedup por
    personId/QID.
  - `actorsByAppearance(doramas)` — agrega atores, ordena por aparições desc,
    desempate nome asc.
  - `otherDoramasOf`, `doramasOfPerson` — doramas onde um ator aparece.
- **`catalogStore`** (Zustand): `doramas` + `screen` (navegação), `addDorama`
  (dedup por id), `setDoramas`, `navigate`. **Sem persistência** — a escrita
  na chave `dorama_graph_data` v2 e a migração são da Fase 3.
- **Decisão de escopo**: o código do grafo (graphStore/useLocalStorageGraph/
  graphTransform/types/graph e a UI) **não foi removido na Fase 2** — a UI
  ainda o usa até a Fase 4 (redesign). Fase 2 foi **aditiva**. Persistência v2
  na mesma chave ficou para a Fase 3 para não conflitar com o sistema atual.

### Wikidata / SPARQL (Fase 1) — 2026-08-25
- **Endpoint**: `https://query.wikidata.org/sparql` + `format=json` (SPARQL 1.1
  JSON). GET p/ queries curtas; POST (corpo `query=...`) p/ maiores (não cacheado).
- **Limites**: 60s por query; **5 paralelas por IP**; 60s de processamento / 60s
  por cliente; `429` + `Retry-After`; **User-Agent obrigatório** (política
  Wikimedia).
- **Propriedades**: `P161` = cast member; `P4983` = TMDB TV series ID;
  `P4985` = TMDB person ID; `P18` = imagem. Qualificadores de P161 (P453/P4633)
  são **esparsos** — não confiar para protagonista.
- **Cobertura incompleta**: nem todo item tem `P4985`/`P4983` (ex.: Tom Hanks
  Q2263 sem TMDB). TMDB é fonte de verdade; Wikidata é **complemento de elenco**.
- **Implementação**: `src/services/wikidata.ts` — `resolveSeriesQidsByTmdbIds`
  (1 query `VALUES`), `fetchCastForQid`, `castQueryForQids` (lote),
  `sparqlQuery` (fetch injetável p/ teste, `User-Agent`). `WikidataHttpError`
  expõe `status` e `retryAfterMs`.
- **Query de elenco validada ao vivo** (20 atores p/ That '70s Show):
  `?item wdt:P161 ?actor . OPTIONAL{?actor wdt:P4985 ?t} .
   OPTIONAL{?actor wdt:P18 ?i} . SERVICE wikibase:label { ... "pt,en" }`.
- **Pacing**: ao rodar em lote, **sequencial** (1 por vez) — margem segura
  abaixo do teto de 5 paralelas; retry em 429 respeitando `retryAfterMs`.

### Setup de testes + lint (Fase 0) — 2026-08-25
- **Vitest 4.1.x + React Testing Library (jsdom)**. `engines` do Vitest 4:
  `^20.0.0 || ^22.0.0 || >=24.0.0`; requer **Vite ≥ 6.4**. Config no bloco
  `test` de `vite.config.ts` (`environment: "jsdom"`, `setupFiles:
  ./tests/setup.ts`, `globals: true`). tsconfig ganhou
  `"types": ["vitest/globals", "vitest/jsdom"]` e `include: ["src", "tests"]`.
- **Gotcha jsdom**: `jsdom@30` quebra em runtime com `ERR_REQUIRE_ESM`
  (via `html-encoding-sniffer@6` → `@exodus/bytes`, ESM-only). **Fix: usar
  `jsdom@^26`** (estável, compatível).
- **ESLint 9 (flat config)** em `eslint.config.js`, com `@eslint/js` +
  `typescript-eslint@8` + `eslint-plugin-react-hooks@7`. `npm run lint` era
  um script sem dep instalada; agora roda de verdade.
- **Baseline de lint**: arquivos legados do modelo de grafo estão **ignorados**
  no `eslint.config.js` (ex.: `src/components/graph/**`,
  `src/store/graphStore.ts`, `src/hooks/useLocalStorageGraph.ts`,
  `src/types/d3-force-3d.d.ts`, `src/types/graph.ts`). São removidos/reescritos
  na **Fase 4** (redesign sem gráficos); evita retrabalho em código descartado.
  **Remover os ignores quando o grafo sair.**
- Cobertura: `npm run test:coverage` (exige `@vitest/coverage-v8` — instalar
  quando for usar; não instalado ainda).

### Export de PDF (`src/utils/exportPdf.ts`) — 2026-08-25
- A implementação original gerava uma **tabela textual** de doramas (nº,
  título, nº de atores) — o `tasks.md` (T037) previa exportar a **imagem do
  grafo** via html2canvas, mas isso **não foi implementado**; o comportamento
  real é a tabela. Documentado por divergência intencional entre spec e código.
- A contagem de atores por dorama utiliza o **target** dos links actor→dorama
  (formato do grafo v1). Com o modelo v2 (catálogo sem links), essa fonte deve
  ser substituída por `DoramaRecord.cast.length`.
- **Limitação CJK**: jsPDF com fonte padrão `helvetica` só cobre latin-1;
  títulos em coreano/japonês podem sair ilegíveis. Para suporte completo seria
  preciso registrar uma fonte WOFF customizada.
- Boas práticas adotadas: `buildDoramaPdf({id,title,year,actorCount}[])` é a
  função pura e testável (retorna `jsPDF`, sem disparar download); o download
  (`pdf.save`) fica no adaptador `exportGraphToPdf` (compat v1, a remover na
  Fase da UI). Cabeçalho/colunas repetidos a cada página; títulos truncados
  com `splitTextToSize`.
