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

## Tarefa ativa: Fase 1 — Serviço Wikidata (SPARQL) + types

**Status**: ⏳ Pendente (aguarda execução).
**Plano completo**: ver `C:\Users\eliog\.opencode\plan\wikidata-redesign.md`
(seções Fase 1+ e o conteúdo para este PLANS.md).

### Resumo do que vem (referência)
1. Fase 1 — `services/wikidata.ts` (SPARQL), `types/wikidata.ts`, testes com
   `fetch` mockado. Endpoint/limits/props já validados ao vivo (P161, P4983,
   P4985, P18).
2. Fase 2 — Modelo v2 (`DoramaRecord`/`CastMember`), `catalogStore`,
   derivações + remoção do grafo.
3. Fase 3 — Migração automática v1→v2 (backup, rehidratação TMDB, Wikidata em
   lote, progresso, parcial `migrationPending`).
4. Fase 4 — UI: telas Doramas/Atores + detalhes, nav no topo, remoção do
   grafo. **Remover ignores de grafo do `eslint.config.js` aqui.**
5. Fase 5 — Docs (MEMORIES/AGENTS/PLANS) + verificação final.
