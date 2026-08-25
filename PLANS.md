# Planos e progresso

Rastreamento de tarefas longas (>30min) ou multi-sessão: plano curto e
progresso. Uma seção por tarefa ativa; remover ao concluir.

---

## ✅ Concluída: Fase 0 — Infra de testes + lint

**Concluída em**: 2026-08-25 | **Commit**: _(ver itens abaixo, commit da Fase 0)_

### O que foi entregue
- **Vitest 4.1.x + React Testing Library (jsdom)**: config no bloco `test` de
  `vite.config.ts`; setup em `tests/setup.ts`; tsconfig com
  `types: ["vitest/globals", "vitest/jsdom"]` e `include: ["src", "tests"]`.
- **Scripts**: `test`, `test:watch`, `test:coverage` no `package.json`.
- **ESLint 9 (flat config)** em `eslint.config.js` — `npm run lint` agora roda
  de verdade (antes era script sem dep instalada).
- **10 testes iniciais** (3 arquivos): `deduplicate`, `graphStore`,
  `exportPdf`.

### Decisões relevantes
- **Node 22.4 é compatível**: o `engines` real do Vitest 4.1.11 é
  `^20.0.0 || ^22.0.0 || >=24.0.0` (a doc no branch main diz "≥22.12", mas o
  pacote aceita 22.x). **Não foi preciso atualizar o Node.**
- **Gotcha jsdom**: `jsdom@30` quebra (`ERR_REQUIRE_ESM` via
  `html-encoding-sniffer@6` → `@exodus/bytes`). **Fix: `jsdom@^26`.**
- **Baseline de lint**: arquivos legados do grafo ignorados no
  `eslint.config.js` (serão removidos na Fase 4). Ver `docs/MEMORIES.md`.

### Verificação (tudo verde)
- ✅ `npm test` — 10 testes passando
- ✅ `npm run lint` — 0 erros
- ✅ `npm run build` (tsc + vite)
- Obs: `npm run test:coverage` exige `@vitest/coverage-v8` (não instalado).

---

## ✅ Concluída: Fase 1 — Serviço Wikidata (SPARQL) + types

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 1, logo abaixo)_

### Entregue
- `src/services/wikidata.ts`: `sparqlQuery` (fetch injetável, `User-Agent`,
  `format=json`), `resolveSeriesQidsByTmdbIds` (1 query `VALUES`),
  `fetchCastForQid` (P161+P4985+P18+label), `castQueryForQids` (lote),
  `qidFromUri`, `WikidataHttpError` (status + `retryAfterMs`).
- `src/types/wikidata.ts`: `SparqlBinding`, `SparqlResults`, `WikidataCastRow`,
  `TmdbToQidMap`.
- **11 testes** em `tests/wikidata.test.ts` (fetch mockado): mapeamento,
  normalização, fallback de label, QID inválido, erro 429/Retry-After, montagem
  de query. Suite total agora com **21 testes**.
- `docs/MEMORIES.md` e `AGENTS.md` atualizados.

### Verificação (verde)
- ✅ `npm test` (21), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

### Pendências p/ Fase 2
- `sparqlQuery` lança em 429 mas **não faz retry**; o pacing (sequencial + retry
  com `retryAfterMs`) será usado no lote da **Fase 3** (migração) e no consumo
  pela UI. `castQueryForQids` está implementada mas ainda não usada em prod.

---

## ✅ Concluída: Fase 2 — Modelo v2 + store + derivação

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 2, abaixo)_

### Entregue (aditivo — grafo legado mantido até a Fase 4)
- `src/types/models.ts`: `DoramaRecord`, `CastMember`, `SCHEMA_VERSION = 2`,
  `DoramaDocument`, `PROTAGONIST_TOP_N = 3`, `Screen`.
- `src/utils/derivations.ts` (puras): `applyProtagonistHeuristic`,
  `tmdbCastToMembers`, `mergeCast`, `actorsByAppearance`, `otherDoramasOf`,
  `doramasOfPerson`.
- `src/store/catalogStore.ts`: `doramas` + `screen`, `addDorama` (dedup),
  `navigate`, `setDoramas`. **Sem persistência** (fica p/ Fase 3, mesma chave).
- **Testes**: +8 derivações, +3 catalogStore (total **32**).
- **Decisão**: remoção do grafo e persistência v2 na chave movidas p/ Fase 3/4
  (evita conflito de chave e quebra da UI). Ver `docs/MEMORIES.md`.

### Verificação (verde)
- ✅ `npm test` (32), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

---

## ✅ Concluída: Fase 3 — Migração automática v1→v2

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 3, abaixo)_

### Entregue (aditivo — migração pronta, ainda não montada na UI)
- `src/services/tmdb.ts`: +`getSeriesDetails` (`/tv/{id}`).
- `src/services/wikidata.ts`: +`fetchCastForQids` (lote sequencial, retry 429
  com `retryAfterMs`, pacing) — resolve pendência de pacing da Fase 1.
- `src/services/persistence.ts`: detecção v1/v2, read/write v2, backup
  `dorama_graph_backup_v1`, `StorageLike` injetável.
- `src/services/migration.ts`: `migrateIfNeeded` com deps injetáveis + progresso
  + persistência parcial. **Protege contra perda de dados** (gotchas na memória).
- `src/hooks/useAppInit.ts`: hook que roda a migração real e povoa o
  `catalogStore`. **Ainda NÃO montado na UI** — conectar na Fase 4 (a UI
  legada usa a mesma chave e brigariam).
- Testes: +7 persistence, +7 migration (total **46**).

### Verificação (verde)
- ✅ `npm test` (46), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

### Pendências p/ Fase 4
- Montar `useAppInit` no entry (`main.tsx`/`App`).
- Remover UI do grafo; trocar `Sidebar`/`GraphCanvas` por telas do catálogo;
  remover ignores de grafo do `eslint.config.js`.

---

## ✅ Concluída: Fase 4 — UI: telas Doramas/Atores + detalhes

**Concluída em**: 2026-08-25 | **Commits**: `feat(ui)`, `refactor(ui)`,
`test(ui)` e docs (abaixo).

### Entregue
- **Init no entry**: `App` monta `useAppInit` com gating — splash
  (`InitScreen`) com barra de progresso durante a migração; erro parcial vira
  banner (não bloqueia).
- **Layout novo**: `Header` substitui o `Sidebar` (logo + tabs Doramas/Atores +
  busca global responsiva).
- **Telas do catálogo** (`src/components/catalog/`): `DoramasScreen` (grade de
  cards + Exportar PDF + Limpar Dados), `AtoresScreen` (`actorsByAppearance`),
  `DoramaDetailScreen` (sinopse + elenco + "também em…" via `otherDoramasOf` +
  remover), `AtorDetailScreen` (`doramasOfPerson`).
- **Busca/add v2**: `SearchInput` reescrito (dedup, busca details+cast,
  monta record via `doramaFromTmdb`); `useTMDB` ganhou `fetchDetails`.
- **Store**: `catalogStore` + `removeDorama` e `clearAll`; persistência no
  **`useCatalogActions`** (ponte store ↔ `writeV2Doc`).
- **Remoção do grafo**: deletados ForceGraph/Drawer/GraphCanvas/Sidebar,
  graphStore, useLocalStorageGraph/useGraph, graphTransform, types/graph,
  d3-force-3d.d.ts e tests/graphStore. `react-force-graph-2d` saiu do
  package.json; ignores de grafo removidos do `eslint.config.js`.
- **V1 types locais** em `persistence.ts` (migração ainda lê dados v1).
- **PDF**: adaptador `exportGraphToPdf` removido; UI usa `buildDoramaPdf` com
  `actorCount = dorama.cast.length`.
- Testes: +doramaFromTmdb, +removeDorama/clearAll, +9 RTL (App + SearchInput).
  Total: **57**.

### Decisões relevantes (detalhes em `docs/MEMORIES.md`)
- Add manual é **TMDB-only** (sem Wikidata no fluxo interativo); `wikidataId`
  fica null até re-hidratação futura.
- Persistência continua **fora do store** (decisão da Fase 2 mantida).

### Verificação (verde)
- ✅ `npm test` (57), ✅ `npm run lint` (sem ignores), ✅ `npm run build`,
  ✅ `npx tsc -b`.

---

## ✅ Concluída: Pendências fora de escopo da Fase 4

**Concluída em**: 2026-08-25 | **Commits**: `feat(wikidata)`,
`test(coverage)`, `feat(pdf)`, `chore(audit)` e docs (abaixo).

### P1 — Re-hidratação Wikidata (adds manuais)
- `enrichDoramaWithWikidata` (pura, idempotente) em `derivations.ts`.
- `src/services/rehydrate.ts`: `rehydrateDoramas` com deps injetadas (padrão
  migration) — processa só `wikidataId == null`, resolve QIDs + elenco em lote
  (pacing/retry), não persiste por conta própria.
- `catalogStore.updateDorama` + `useCatalogActions.updateDorama`.
- `src/hooks/useRehydrate.ts`: `rehydrateOne`/`rehydrateAll` + `busy`/`progress`/`error`.
- UI: botão "Enriquecer elenco (Wikidata)" no detalhe; "Sincronizar Wikidata"
  (badge de pendentes + progresso) na lista.

### P2 — Cobertura de testes
- Instalado `@vitest/coverage-v8`; `npm run test:coverage` agora roda (v8).

### P3 — Suporte CJK no PDF
- `public/fonts/NanumGothic-Regular.ttf` + `OFL.txt` (~2MB, licença OFL).
- `exportPdf.ts`: `loadCjkFont()` (fetch + cache), `registerCjkFont()` e
  `buildDoramaPdf(doramas, { cjkFont? })` — títulos em hangul/japonês usam a
  fonte custom; chrome/números continuam em helvetica; fallback sem a fonte.
- Handler do export virou async ("Preparando PDF…"); `@types/node` + `"node"`
  nos types da tsconfig (para ler o TTF em teste).

### P4 — npm audit
- `npm audit fix`: `dompurify` 3.4.12→3.4.14, `postcss` 8.5.16→8.5.26,
  `nanoid` 3.3.15→3.3.18 → **0 vulnerabilidades**.

### Verificação (verde)
- ✅ `npm test` (**72**), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`,
  ✅ `npm audit` (0), ✅ `npm run test:coverage`.

---

## Remanescentes p�s-Fase 4 (2� leva) � 2026-08-25

**Conclu�das**: remover `@types/jspdf`, limiares de cobertura, auto-re-hidrata��o
em background. **Adiado (analisado)**: subset da fonte CJK.

- `3b393c2` build(deps): remove `@types/jspdf` obsoleto (jspdf v4 j� traz tipos).
- `4cd6b81` test(coverage): define limiares globais de cobertura no vitest.
- `c1bb3fc` feat(rehydrate): auto-re-hidrata��o de pendentes em background.
- Subset CJK: **adiado** � build-time est�tico reduz s� ~3% (coreano exige o
  bloco Hangul completo); runtime por t�tulo (~19 KB) exigiria `subset-font`
  (node-only/WASM) no browser � invi�vel sem bundling fr�gil. Mantido: fonte
  completa carregada sob demanda s� quando h� CJK. Ver `docs/MEMORIES.md`.

### Verifica��o (verde)
- ? `npm test` (**75**), ? `npm run lint`, ? `npm run build`, ? `npx tsc -b`,
  ? `npm run test:coverage` (limiares OK), ? `npm audit` (0).

---
