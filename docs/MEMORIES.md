# Memórias do projeto

Memória durável: decisões, APIs mapeadas, gotchas e convenções.
Registre aqui toda informação nova e durável em vez de repetir no
`AGENTS.md`. Antes de investigar, confira se já consta aqui.

## Registros

### Pendências pós-Fase 4 — re-hidratação, cobertura, CJK e audit — 2026-08-25
- **Re-hidratação Wikidata** (adds manuais são TMDB-only):
  - `enrichDoramaWithWikidata(dorama, qid, wikiRows)` (pura, idempotente) —
    seta `wikidataId` e faz `applyProtagonistHeuristic(mergeCast(cast, rows))`.
  - `src/services/rehydrate.ts` → `rehydrateDoramas(doramas, deps)` (deps
    injetadas como em `migration.ts`): processa só `wikidataId == null`;
    resolve QIDs no lote (`resolveSeriesQidsByTmdbIds`) + elenco em lote
    (`fetchCastForQids`, pacing/retry); **não persiste** (quem chama cuida);
    falha de lote propaga sem mutar estado. Progresso via `onProgress`.
  - `catalogStore.updateDorama` + `useCatalogActions.updateDorama` (store +
    `writeV2Doc`).
  - `src/hooks/useRehydrate.ts`: `rehydrateOne(id)` e `rehydrateAll()` com
    `busy`/`progress`/`error`; atualiza o store e persiste por dorama
    (recuperação parcial).
  - UI: "Enriquecer elenco (Wikidata)" no `DoramaDetailScreen` (só quando
    `wikidataId == null`); "Sincronizar Wikidata" na `DoramasScreen` (badge de
    pendentes, progresso inline, disabled com 0 pendentes).
  - Dorama sem QID na cobertura do Wikidata permanece `null` (retentado no
    próximo lote — custo baixo).
- **Cobertura**: `@vitest/coverage-v8` instalado — `npm run test:coverage` roda
  (provider v8). Sem limiares.
- **CJK no PDF**:
  - `public/fonts/NanumGothic-Regular.ttf` (+`OFL.txt`, ~2MB, **OFL 1.1**) —
  Google Fonts (repo `google/fonts`, `ofl/nanumgothic`). Asset estático, fora
  do bundle JS; carregada sob demanda no export.
  - jsPDF exige **TTF** (magic `\x00\x01\x00\x00`; WOFF não parseia). Padrão:
  `addFileToVFS` → `addFont` → `setFont`.
  - `exportPdf.ts`: `loadCjkFont()` (fetch + cache em módulo),
  `registerCjkFont(pdf, binary, name?)`, `buildDoramaPdf(doramas,
  { cjkFont? })` — **só os títulos** usam a fonte CJK (chrome/nº/count ficam em
  helvetica, que cobre latin-1 pt-BR como "Título"); sem a fonte → helvetica
  (fallback, títulos CJK ilegíveis).
  - `@types/node` adicionado e `"node"` em `tsconfig.types` (o `types` restrito
  não inclui packages globais; necessário p/ `node:fs` nos testes).
- **Audit**: `npm audit fix` (sem `--force`) atualizou transitivas protegidas:
  `dompurify` 3.4.12→3.4.14 (via jspdf, runtime), `postcss` 8.5.16→8.5.26 e
  `nanoid` 3.3.15→3.3.18 (via vite, dev) → **0 vulnerabilidades**.
  - Nota: `eslint-visitor-keys@5` (via typescript-eslint, dev) pede Node
    ≥22.13 — roda OK no Node 22.4, apenas `EBADENGINE` warning.

### Remanescentes pós-Fase 4 (2ª leva) — 2026-08-25
- **Removido `@types/jspdf`**: jspdf v4 já traz tipos próprios; sobrava
  `@types/jspdf@1.3.3` (v1 API) em conflito/obsoleto. `tsc -b` passa com os
  tipos do pacote.
- **Limiares de cobertura**: `vite.config.ts` `test.coverage.thresholds`
  (v8) — statements 75 / branches 60 / functions 70 / lines 75 (abaixo dos
  valores atuais: ~81/66/76/79, com margem).
- **Auto-re-hidratação em background**: `src/hooks/useAutoRehydrate.ts`
  (usa `useRehydrate().rehydrateAll`) chamado em `App` após o gating de init;
  dispara **uma vez** quando o catálogo carrega com pendentes (`wikidataId ==
  null`). Não bloqueia a UI; badge/progresso refletem o andamento.
- **Subset da fonte CJK — ANALISADO E ADIADO (não viável com ganho real)**:
  - Build-time estático com `subset-font` (node-only, WASM via `fs`/`require`)
    reduziu só ~3% (2007→1938 KB): para coreano o **bloco Hangul Syllables
    completo (~11k glifos) é obrigatório para corretude** e domina o tamanho da
    fonte — qualquer subset estático correto de coreano ≈ 2MB.
  - Ganho real (~19 KB) exigiria subset **por título em runtime**; as libs
    disponíveis não servem no browser: `subset-font` carrega WASM via
    `require('fs')`/`require.resolve` (só node); `fontkit@2` subsettter está
    quebrado p/ glyf; `opentype.js@2` removeu `font.subset`. Bundlear o WASM do
    harfbuzzjs no Vite é frágil e não testável aqui.
  - **Decisão**: manter a fonte completa (carregada sob demanda **só** quando o
    título tem caractere > Latin-1: `hasCjkChars`) — otimização segura já em
    vigor. Não se adicionou dependência para ganho negligenciável.
  - Opções para o usuário, se quiser prosseguir: (a) build-time subset completo
    de Hangul (~3%, dep dev `subset-font` + script); (b) runtime subset por
    título com shim de WASM no browser (ganho real, risco de bundling).

### Dedup de atores (id canônico) — Fase 5 — 2026-08-25
- **Problema**: o mesmo ator físico aparecia com `personId` divergente entre
  doramas — TMDB id num dorama migrado e Wikidata QID (`"Q678"`) noutro vindo
  só do Wikidata — dividindo-o em "atores" separados e quebrando
  cross-references e a página de detalhe.
- **Solução (não destrutiva, em nível de leitura)**: `derivations.ts` ganhou
  `actorIds(member)` (`[wikidataId, personId]`, QID primeiro),
  `buildCanonicalIdMap(doramas)` (union-find de TMDB id ↔ QID → id canônico,
  prefere `wikidataId`) e `canonicalId(member, map)`. `actorsByAppearance`,
  `otherDoramasOf`, `doramasOfPerson` agrupam/buscam pelo id canônico.
- **UI**: `AtorDetailScreen` faz lookup por id canônico; `DoramaDetailScreen`
  (`CastRow`) navega/cruza pelo id canônico. `ActorAppearance.personId` virou o
  id canônico (consumido pelo `AtoresScreen` sem mudança).
- **Limite conhecido**: ator só-Wikidata (`Q678`) num dorama vs ator TMDB num
  dorama manual ainda não re-hidratado (`123`, sem `wikidataId`) segue separado
  — não há casamento por nome (fuzzy: risco de fundir pessoas diferentes).
  Resolvido quando o dorama manual é re-hidratado (ganha `wikidataId`).
- **Decisão**: não reescrever `CastMember.personId` persistido — mantém dados
  originais e é reversível.

### UI do catálogo v2 + remoção do grafo (Fase 4) — 2026-08-25
- **Init no entry**: `App` chama `useAppInit` e **gating** — enquanto
  `loading`, renderiza `InitScreen` (splash com barra de progresso `done/total`
  durante migração). Erro parcial vira **banner** (não bloqueia o uso).
- **Navegação por `screen`** (sem router): `Header` (logo + tabs Doramas/Atores
  + `SearchInput`) + telas em `src/components/catalog/`: `DoramasScreen`
  (cards com poster/ano/nº atores/badge protagonistas + Exportar PDF + Limpar
  Dados), `AtoresScreen` (`actorsByAppearance`), `DoramaDetailScreen` (sinopse +
  elenco com badge protagonista + "também em…" via `otherDoramasOf` + remover),
  `AtorDetailScreen` (`doramasOfPerson` ordenado por ano desc).
- **Add manual = TMDB-only**: busca → `getSeriesDetails` + `getSeriesCast` →
  `doramaFromTmdb(details, cast, imageUrl)` → `addDorama` + persistir.
  **Sem Wikidata** no fluxo interativo (evita latência/rate-limit);
  `wikidataId` fica `null` até re-hidratação futura. A migração v1→v2 mantém o
  enriquecimento completo (TMDB ⊕ Wikidata).
- **Persistência fora do store** (mantém decisão da Fase 2): `useCatalogActions`
  é a ponte store ↔ `writeV2Doc` (`addDorama`/`removeDorama`/`clearAll`). O
  `catalogStore` ganhou `removeDorama` e `clearAll` (puros).
- **V1 types sobrevivem**: `V1Node`/`V1Link`/`V1GraphDocument` agora vivem em
  `src/services/persistence.ts` (a migração ainda lê dados v1). `types/graph.ts`
  e `types/d3-force-3d.d.ts` foram **deletados**.
- **Grafo legado removido**: ForceGraph/DoramaDetailsDrawer/GraphCanvas/Sidebar,
  `graphStore`, `useLocalStorageGraph`/`useGraph`, `graphTransform`,
  `tests/graphStore.test.ts`. Dep `react-force-graph-2d` removida (d3-force-3d
  era transitiva). **Ignores de grafo removidos do `eslint.config.js`** — todo o
  `src/` é lintado agora.
- **PDF**: `exportGraphToPdf` (adaptador Node/Link) removido; a UI chama
  `buildDoramaPdf` direto com `actorCount = dorama.cast.length` — resolve a
  divergência registrada na Fase 0 (fonte de contagem do modelo v2).
- **`thumbUrl`** (`src/utils/images.ts`): troca `w500 → w200` em URLs TMDB para
  miniaturas (perfis do elenco); `imageUrl` mantém `w500` para posters/detalhes.
- **Gotcha de teste**: async flows de busca/add disparam warnings de `act(...)`
  com `fireEvent`; usar `userEvent.setup()` (`@testing-library/user-event`)
  que encapsula em `act`.

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
