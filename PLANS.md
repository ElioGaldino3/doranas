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

## Tarefa ativa: Fase 2 — Modelo v2 + store + derivação

**Status**: ⏳ Pendente (aguarda execução).
**Plano completo**: `C:\Users\eliog\.opencode\plan\wikidata-redesign.md` (Fase 2).

### Resumo
- Tipos v2: `DoramaRecord`/`CastMember`, `SCHEMA_VERSION = 2`.
- `catalogStore` (Zustand): `doramas`, `screen`, seleções + ações.
- `derivations.ts`: `actorsByAppearance`, `otherDoramasOf`,
  `applyProtagonistHeuristic` (billing top-3), merge TMDB⊕Wikidata.
- Persistência em `dorama_graph_data` v2; remover `graphStore`/`useGraph`/
  `useLocalStorageGraph`/`types/graph.ts`.
- Testes de derivação + merge.

### Roadmap pendente
- **Fase 3** — Migração automática v1→v2 (backup, rehidratação TMDB,
  Wikidata em lote, progresso, parcial `migrationPending`).
- **Fase 4** — UI: telas Doramas/Atores + detalhes, nav no topo, remoção do
  grafo. **Remover ignores de grafo do `eslint.config.js` aqui.**
- **Fase 5** — Docs (MEMORIES/AGENTS/PLANS) + verificação final.
