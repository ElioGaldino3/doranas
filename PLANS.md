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

## ✅ Concluída: Fase 5 — Dedup de atores (id canônico)

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 5, abaixo)_

### Problema
O mesmo ator físico podia aparecer com `personId` **divergente** entre doramas
— TMDB id (ex.: `"12345"`) num dorama migrado e Wikidata QID (`"Q678"`) noutro
vindo só do Wikidata. Isso o dividia em "atores" separados na tela de Atores,
quebrava os cross-references ("também em…") e a página de detalhe do ator (só
listava 1 dorama).

### Entregue (dedup em nível de leitura, não destrutivo)
- `src/utils/derivations.ts`:
  - `actorIds(member)` — ids pelos quais um membro pode ser referenciado
    (`[wikidataId, personId]`, priorizando o QID).
  - `buildCanonicalIdMap(doramas)` — union-find de TMDB id ↔ QID → id canônico
    (prefere `wikidataId` na classe). Resolve a divergência sem tocar nos dados
    persistidos.
  - `canonicalId(member, map)`.
  - `actorsByAppearance`, `otherDoramasOf`, `doramasOfPerson` agora agrupam/
    buscam pelo id canônico.
- UI: `AtorDetailScreen` (lookup por id canônico) e `DoramaDetailScreen`
  (`CastRow` navega/cruza pelo id canônico). `AtoresScreen` já consumia
  `ActorAppearance.personId`, que passou a ser o id canônico — sem mudança.
- **Testes**: +7 em `tests/derivations.test.ts` (mapa canônico, unificação do
  ator splitado em 1 entrada com 2 aparições, `doramasOfPerson`/`otherDoramasOf`
  cruzando o split, não-fusão de atores distintos). Total: **82**.

### Decisões relevantes
- **Dedup não destrutivo**: canonicalização em tempo de leitura (derivações
  puras), sem reescrever `CastMember.personId` persistido. Preserva os dados
  originais e é reversível; evita risco de corromper o histórico.
- **Limite conhecido**: ator só-Wikidata num dorama (id `Q678`) vs ator TMDB
  num dorama manual ainda não re-hidratado (id `123`, sem `wikidataId`)
  continua separado — não há casamento de nome (fuzzy matching é arriscado:
  nomes iguais ≠ mesma pessoa, grafias variam). Resolvido naturalmente quando o
  dorama manual é re-hidratado (ganha `wikidataId`).

### Verificação (verde)
- ✅ `npm test` (82), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

---

## ✅ Concluída: Fase 6 — Backup/Restore JSON

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 6, abaixo)_

### Problema
Os dados viviam só no `localStorage` (chave `dorama_graph_data`): sem
portabilidade nem cópia de segurança. Perder o storage (limpeza de
navegador, troca de máquina) era perda total do catálogo.

### Entregue (export/import do catálogo como `.json`, não-destrutivo)
- `src/utils/backup.ts` (puro, testável):
  - `serializeCatalog(doramas)` → `DoramaDocument` v2 (mesma forma
    persistida) com `updatedAt`.
  - `parseBackup(raw)` → aceita **doc v2 completo OU array cru** de doramas;
    lança em JSON inválido / schema incompatível / entrada sem `id`+`title`.
  - `mergeDoramas(existing, imported)` → mescla por TMDB id **sem mutar
    inputs**; em colisão o **importado prevalece**; preserva existentes
    ausentes no arquivo (operação não-destrutiva).
  - `BACKUP_FILENAME = "dorama-actors-backup.json"`.
- `src/hooks/useCatalogActions.ts`: +`importDoramas(records)` (mescla no
  store + persiste via `writeV2Doc`; retorna `false` em falha de quota).
- `src/components/catalog/DoramasScreen.tsx`: botões **Exportar JSON**
  (Blob + download) e **Importar JSON** (input file oculto → `FileReader` →
  `parseBackup` → `importDoramas`) com banners de sucesso/erro. Import
  também acessível no estado vazio (restaurar catálogo zerado).
- **Testes**: +11 em `tests/backup.test.ts` (serialize, parse v2/array,
  rejeição de inválidos, merge não-destrutivo + prevalência, bridge
  `importDoramas` no store+localStorage). Total: **93**.

### Decisões relevantes
- **Merge, não replace**: escolha alinhada à postura não-destrutiva do
  projeto (Fase 5) — nunca apaga doramas existentes; importado vence só em
  id igual.
- **Download/Blob no componente** (não no util): segue o padrão do
  `buildDoramaPdf` (lógica pura testada no util; disparo de download fica
  no chamador). `parseBackup` recebe string, então o `FileReader` fica na UI.
- Export desabilitado quando o catálogo está vazio (nada a exportar).

### Verificação (verde)
- ✅ `npm test` (93), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

---

## ✅ Concluída: Fase 7 — Filtros e ordenação do catálogo

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 7, abaixo)_

### Problema
A grade de doramas (`DoramasScreen`) era estática: sem ordenação nem
filtragem local. Com o catálogo crescendo, encontrar/ordenar doramas
exigia rolar muito. A busca global do header só adiciona itens do TMDB,
não filtra o que já está no catálogo.

### Entregue (filtro local por título + ordenação)
- `src/utils/catalogView.ts` (puro, testável):
  - `DoramaSort = "recent" | "title" | "year"`.
  - `sortDoramas(doramas, sortBy)` — recente (addedAt↓), título (colação
    pt-BR `Intl.Collator` base+numeric, ignora acento), ano (↑, nulos por
    último); **não muta** a entrada.
  - `filterDoramas(doramas, query)` — substring case-insensitive no título;
    query vazia retorna a própria lista (sem alocação).
- `src/components/catalog/DoramasScreen.tsx`:
  - Estado `sortBy`/`query` + `visible = useMemo(sortDoramas(filterDoramas(...)))`.
  - Controle de **filtrar por título** (input com ícone `Search`) e **ordenar**
    (`select` com `ArrowUpDown`: Recentes / Título A-Z / Ano ↑), abaixo da
    barra de ações.
  - Contador reflete filtro ("X de Y doramas" quando há busca).
  - Grade renderiza `visible`; busca sem resultado mostra "Nenhum dorama
    corresponde à busca." Exportar PDF/JSON continua usando o catálogo
    **completo** (não a vista filtrada).
- **Testes**: +8 em `tests/catalogView.test.ts` (ordenções, não-mutação,
  colação pt-BR, nulo por último, filtro case-insensitive/vazio/sem match).
  Total: **101**.

### Decisões relevantes
- **Ordenação pt-BR correta**: `Intl.Collator("pt-BR", {numeric:true})`
  coloca "Água" antes de "Crash"/"Zona" e ordena anos como texto numérico.
- **Export usa catálogo completo**, não a vista filtrada — o backup deve ser
  do acervo inteiro, não de um recorte temporário da UI.
- **Sem nova dependência**; `select`/`input` nativos estilizados com Tailwind.

### Verificação (verde)
- ✅ `npm test` (101), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

---

## ✅ Concluída: Fase 8 — Merge manual de atores

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 8, abaixo)_

### Problema (limitação conhecida da Fase 5)
O dedup automático (id canônico) só unifica quando há um **id compartilhado**
(TMDB id ↔ Wikidata QID). Quando o mesmo ator físico aparece em doramas
diferentes **sem** nenhum id em comum — ator só-TMDB (`"123"`) num e ator
só-Wikidata (`"Q678"`) noutro — ele continua separado em "2 atores".

### Entregue (merge manual não-destrutivo via aliases)
- `src/types/models.ts`: `DoramaDocument.actorAliases?: Record<string,string>`
  (`sourceId → targetCanonicalId`); campo opcional (backward compatible, não
  exige bump de `SCHEMA_VERSION`).
- `src/utils/derivations.ts`:
  - `resolveAlias(id, aliases)` — segue a cadeia `source→target` até o
    terminal; protegido contra ciclos (conjunto de visitados).
  - `buildCanonicalIdMap(doramas, aliases?)` resolve cada id pelo alias antes
    do union-find e "assenta" (bake) o alias no mapa — unifica o ator splitado
    sem tocar nos `CastMember` persistidos.
  - `canonicalId`, `actorsByAppearance`, `otherDoramasOf`, `doramasOfPerson`
    ganham `aliases?` (default `{}`).
- `src/services/persistence.ts`: `writeV2Doc` aceita `actorAliases` no `extra`.
- `src/utils/backup.ts`: `serializeCatalog(doramas, aliases?)` inclui os
  aliases no export; `parseBackup` vira `ParsedBackup { doramas, actorAliases? }`
  (preserva merges na importação).
- `src/store/catalogStore.ts`: +`actorAliases`, `setActorAliases`,
  `addActorAlias(source, target)` (no-op se `source===target`); `clearAll`
  zera aliases.
- `src/hooks/useCatalogActions.ts`: `persist()` grava `actorAliases`;
  +`mergeActorAlias(source, target)` (store + persist) e `importDoramas`
  agora recebe `ParsedBackup` e funde aliases (importado prevalece).
- `src/hooks/useAppInit.ts`: após migração, lê `actorAliases` do doc v2 e
  povoa o store.
- UI: `AtorDetailScreen` ganha "Mesclar com…" (`select` de outros atores →
  `mergeActorAlias(target, thisCanonical)`); `AtoresScreen`/`DoramaDetailScreen`/
  `AtorDetailScreen` repassam `actorAliases` às derivações. `DoramasScreen`
  exporta/importa aliases.
- **Testes**: +21 (resolveAlias + cadeia/ciclo; unify TMDB-only⊕Wikidata-only
  via alias em `actorsByAppearance`/`doramasOfPerson`/`otherDoramasOf`;
  `serializeCatalog`/`parseBackup` com aliases; bridge `mergeActorAlias` +
  `importDoramas` fundindo aliases; `parseBackup` retornando `ParsedBackup`).
  Total: **114**.

### Decisões relevantes
- **Não-destrutivo**: o merge é um alias em tempo de leitura (mesma postura
  das Fases 5/7). Reverte-se removendo o alias; não reescreve `CastMember`.
- **Alias no doc v2** (não chave separada): mantém 1 fonte de verdade
  (`dorama_graph_data`); campo opcional evita bump de schema.
- **Ciclo**: `resolveAlias` termina no ponto de entrada do ciclo; UI proíbe
  `source===target`, logo ciclos reais não ocorrem.

### Verificação (verde)
- ✅ `npm test` (114), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

---

## ✅ Concluída: Fase 9 — Painel de estatísticas

**Concluída em**: 2026-08-25 | **Commit**: _(commit da Fase 9, abaixo)_

### Problema
Não havia visão agregada do catálogo — só listas (Doramas/Atores). O usuário
não enxergava totais, atores recorrentes nem distribuição por ano.

### Entregue (tela Estatísticas, derivada e pura)
- `src/utils/stats.ts` (puro, testável): `computeStats(doramas, aliases?)`
  → `CatalogStats { doramaCount, actorCount (canônico), appearanceCount,
  protagonistCount, topActors (TOP_ACTORS_N=5), byYear }`. `actorCount` e
  `protagonistCount` usam ids **canônicos** (dedup automático + alias manual),
  não os ids crus.
- `src/types/models.ts`: `Screen` += `{ name: "estatisticas" }`.
- `src/components/catalog/EstatisticasScreen.tsx`: cards (Doramas/Atores/
  Aparições/Protagonistas), "Atores mais recorrentes" (top 5, clicável →
  detalhe) e "Doramas por ano" (barras; "—" para sem ano, por último). Estado
  vazio amigável.
- `src/components/layout/Header.tsx`: +aba "Estatísticas" (`BarChart3`).
- `src/App.tsx`: rota `screen.name === "estatisticas"`.
- **Testes**: +4 em `tests/stats.test.ts` (vazio; totais/top; ator único via
  alias; agregação por ano com "—" por último). Total: **118**.

### Decisões relevantes
- **Derivação pura**: stats vem de `actorsByAppearance`/`buildCanonicalIdMap`,
  reusando a contagem canônica (coerente com Fases 5/8) — ator splitado conta
  1 vez.
- **Sem nova dependência**; barras com `width` proporcional via `maxYearCount`.
- Aba dedicada (não modal) mantém o padrão de navegação por `screen`.

### Verificação (verde)
- ✅ `npm test` (118), ✅ `npm run lint`, ✅ `npm run build`, ✅ `npx tsc -b`.

---
