# Planos e progresso

Rastreamento de tarefas longas (>30min) ou multi-sessão: plano curto e
progresso. Uma seção por tarefa ativa; remover ao concluir.

---

## Tarefa ativa: Fase 0 — Infra de testes + lint

**Status**: 🔒 BLOQUEADA — falta rede para o npm registry (DNS/timeout).
**Última atualização**: 2026-08-25

### Objetivo
Destravar o loop de verificação (typecheck/lint/test) para as próximas fases
(Wikidata, redesenho sem grafo, migração v2). Adicionar o setup que **hoje não
existe**: Vitest + React Testing Library + ESLint.

### Requisitos verificados (fatos)
- **Node atual: v22.4.0** — **ABAIXO** do mínimo do Vitest 4 (Node **≥ 22.12**).
- Project: `vite ^6.0.0` (instalado **6.4.3** na última verificação) — ok para
  Vitest 4 (peer `^6.4.0 || ^7 || ^8`).
- `npm run lint` hoje falha: script `eslint .` existe no `package.json`, mas
  **ESLint não está instalado** nem configurado.
- Context7 esteve indisponível (DNS `mcp.context7.com`) durante a tentativa.

### Plano (retomar quando a rede voltar)
1. Confirmar/atualizar Node para **≥ 22.12** (Vitest 4) — OU decidir Vitest 3.x
   (compatível Node 22.4) se preferir não mexer no Node.
2. Bump `vite ^6.0.0` → `^6.4.0` no `package.json` (se ainda estiver < 6.4).
3. DevDeps a adicionar:
   - `vitest` (^4.1.6 ou 3.x conforme decisão do Node)
   - `jsdom`, `@testing-library/react ^16`, `@testing-library/jest-dom ^6`,
     `@testing-library/user-event ^14`
   - `eslint ^9`, `typescript-eslint ^8`, `eslint-plugin-react-hooks`
4. Scripts: `"test": "vitest run"`, `"test:watch": "vitest"`,
   `"test:coverage": "vitest run --coverage"`.
5. `vite.config.ts`: bloco `test` (environment `jsdom`, setupFiles, globals) +
   `/// <reference types="vitest/config" />`. `tsconfig.json`: adicionar
   `"types": ["vitest/jsdom"]`. Criar `tests/setup.ts` + `eslint.config.js`
   (flat, react-hooks + TS recomendado).
6. Smoke + primeiros testes reais:
   - `src/utils/deduplicate.ts` (função pura)
   - export: teste do `buildDoramaPdf` (retorna jsPDF, sem download)
   - `src/store/graphStore.ts` (lógica de addDorama/removeDorama — já pura de
     UI, fácil de testar)
7. **Done**: `npm test && npx tsc -b && npm run build` verdes; decidir o que
   fazer com `eslint` (ver nota abaixo).

### Progresso
- [x] Investigação (versões, requisitos, blockers identificados)
- [ ] Instalar dependências (bloqueado por rede)
- [ ] Configurar vitest/eslint
- [ ] Testes iniciais
- [ ] Verificação + commit

### Decisão em aberto — ESLint
O `npm run lint` nunca funcionou (sem dep). Duas opções para a Fase 0:
- **(a)** Adicionar ESLint de verdade (flat config) e fazer `lint` verde.
- **(b)** Corrigir: hoje o script existe mas quebra; ou instalar e corrigir os
  erros, ou remover o script até o lint existir. Recomendação: **(a)** —
  completar o loop de verificação conforme o AGENTS.md exige "rodar
  lint/typecheck/build".

### Bloqueio atual
- `registry.npmjs.org` inacessível (DNS/timeout) — impossível instalar deps.
- Node 22.4 < 22.12 (se for usar Vitest 4).

### Próximo passo ao desbloquear
Rodar `npm install -D <devDeps da fase 0>` e seguir o plano; depois commitar
tudo coeso (bump vite + config + script + testes + AGENTS/WINDOWS/LINUX
atualizados com o comando `npm test`).
