# AGENTS.md — Dorama Actors (doranas)

Guia operacional deste repositório. Leia antes de qualquer tarefa de
código. Instruções objetivas; nada aqui é opcional a menos que marcado
como tal.

## 1. Projeto

**Dorama Actors** é um SPA (single-page application) local-first para
rastrear kdramas assistidos e visualizar conexões entre atores por meio de
um grafo dirigido por força (force-directed graph), renderizado no
navegador.

- **Stack**: TypeScript ~5.6, React 19, Vite 6, Tailwind CSS v4
  (via `@tailwindcss/vite`), Zustand, react-force-graph-2d, jspdf.
- **Dados**: 100% em `localStorage` (chave `dorama_graph_data`). Sem
  backend e sem banco em nuvem.
- **Origem dos dados**: API TMDB via camada de serviço
  (`src/services/tmdb.ts`). Chave em `VITE_TMDB_API_KEY`.
- **Busca**: por título ou IMDb ID (`tt` + 7–8 dígitos). Título →
  `/search/tv`; IMDb → `/find/{id}`.
- **Modelo do grafo**: nós `dorama` (maior, cor de destaque) e `actor`
  (menor, neutro); arestas `ACTED_IN` ligam actor → dorama.
- **Duplicados**: detectados por TMDB ID (merge/dedup em
  `src/store/graphStore.ts`).
- **Persistência em disco**: nenhuma. Deploy em Netlify (SPA) via
  `netlify.toml` (redirect `/*` → `/index.html`).

## 2. Ambiente de desenvolvimento

Identifique o SO e siga o arquivo correspondente antes de qualquer comando:

- **Windows (PowerShell)** → leia `WINDOWS.md`.
- **Linux** → leia `LINUX.md`.

Comandos prontos (já com filtro de output):

| Tarefa        | Comando          |
|---------------|------------------|
| Instalar deps | `npm install`    |
| Dev server    | `npm run dev`    |
| Typecheck     | `npx tsc -b`     |
| Lint          | `npm run lint`   |
| Build         | `npm run build`  |
| Preview       | `npm run preview`|
| Testes        | `npm test`       |
| Testes (watch)| `npm run test:watch` |
| Cobertura     | `npm run test:coverage` |

> **Testes**: Vitest 4 + React Testing Library (jsdom). Requer **Node ≥ 20.0**
> (engines do Vitest 4.1: `^20.0.0 || ^22.0.0 || >=24.0.0`) e **Vite ≥ 6.4**.
> Configuração em `vite.config.ts` (bloco `test`), setup em `tests/setup.ts`.
> ESLint 9 (flat config) em `eslint.config.js`.

**Regra de filtragem de output**: restrinja sempre a saída de comandos ao
que importa (apenas linhas de erro, resumos, chaves). Nunca despeje o
output inteiro no contexto.

## 3. Loop de entrega (obrigatório para toda tarefa de código)

1. **Investigar** — leia o código/docs relevantes. Cheque `docs/` antes
   de reinvestigar algo já registrado.
2. **Analisar** — identifique causa raiz / desenho da solução. Não pule
   direto pra código sem isso.
3. **Planejar** — plano curto (2–6 passos).
4. **Executar** — menor diff possível, seguindo o plano.
5. **Verificar** — rode lint/typecheck/build + testes unitários do projeto.
   - **Falhou** → volte ao passo 3 (planejar) usando o erro como novo
     input. Não fique tentando ajustes aleatórios sem replanejar.
   - **Passou** → passo 6.
6. **Commit** — mensagem objetiva (o quê + por quê), só depois da
   verificação passar. Nunca commitar com teste/lint quebrado.

> **Sempre commitar** ao final de cada tarefa concluída (verificação
> passou), sem esperar permissão explícita. Se a tarefa tiver múltiplas
> entregas, um commit coeso ao final de tudo (ou um commit por entrega se
> forem independentes).

Não pule etapas do loop. Não gaste tempo especulando sobre cenários fora
do escopo da tarefa atual.

## 4. Árvore do projeto e descrição dos arquivos

```text
doranas/
├── .gitignore            # node_modules, dist, build, *.log, .env*, etc.
├── AGENTS.md             # este arquivo
├── WINDOWS.md            # comandos/ambiente Windows (PowerShell)
├── LINUX.md              # comandos/ambiente Linux (bash)
├── PLANS.md              # rastreamento de tarefas longas (>30min/multi-sessão)
├── docs/
│   └── MEMORIES.md       # memória durável do projeto (decisões, gotchas)
├── index.html            # HTML raiz do SPA (monta #root, fonte Inter)
├── netlify.toml          # build (npm run build) + redirect SPA /* → /index.html
├── package.json          # scripts (dev/build/preview/lint/test) e deps
├── package-lock.json     # lockfile
├── tsconfig.json         # strict TS, ES2020, moduleResolution bundler, noEmit
├── tsconfig.tsbuildinfo  # cache incremental do tsc (gerado, ignorado de fato)
├── vite.config.ts        # plugins react + tailwindcss + bloco test (vitest/jsdom)
├── eslint.config.js      # ESLint 9 flat (ignora código legado do grafo — Fase 4)
├── tests/
│   ├── setup.ts                  # import @testing-library/jest-dom/vitest
│   ├── deduplicate.test.ts       # testes de src/utils/deduplicate
│   ├── graphStore.test.ts        # testes de addDorama/removeDorama
│   └── exportPdf.test.ts         # testes do buildDoramaPdf
└── src/
    ├── main.tsx          # entry: React root + import de styles/index.css
    ├── App.tsx           # layout: sidebar (toggle mobile) + GraphCanvas
    ├── vite-env.d.ts     # tipos de import.meta.env do Vite
    ├── components/
    │   ├── drawer/
    │   │   └── DoramaDetailsDrawer.tsx   # drawer com atores em comum
    │   ├── graph/
    │   │   └── ForceGraph.tsx            # wrapper react-force-graph-2d
    │   ├── layout/
    │   │   ├── Sidebar.tsx               # busca + estatísticas
    │   │   └── GraphCanvas.tsx           # container do grafo
    │   └── search/
    │       └── SearchInput.tsx           # input de busca (título/IMDb)
    ├── hooks/
    │   ├── useLocalStorageGraph.ts       # CRUD do grafo no localStorage
    │   ├── useGraph.ts                   # ponte para useLocalStorageGraph
    │   └── useTMDB.ts                    # search + fetchCast (com estados)
    ├── services/
    │   ├── tmdb.ts                       # chamadas à API TMDB (search/find/credits)
    │   └── wikidata.ts                   # cliente SPARQL do Wikidata (P161/P4983/P4985/P18)
    ├── store/
    │   └── graphStore.ts                 # Zustand: nós/links/estado do grafo
    ├── types/
    │   ├── graph.ts                      # Node, Link, GraphDocument
    │   ├── tmdb.ts                       # SearchResult, CastResult, respostas
    │   ├── wikidata.ts                   # SPARQL bindings, WikidataCastRow, TmdbToQidMap
    │   └── d3-force-3d.d.ts              # declaração de tipo do d3
    ├── utils/
    │   ├── graphTransform.ts             # TMDB → nós/arestas do grafo
    │   ├── deduplicate.ts                # helper genérico de deduplicação
    │   └── exportPdf.ts                  # exporta lista como PDF (jspdf)
    └── styles/
        └── index.css                     # entry do Tailwind
```

Notas de estrutura:

- `src/components/` organizado por feature (drawer, graph, layout, search).
- TMDB isolado em `services/` — componentes nunca chamam a API direto.
- Estado de UI efêmero (hover, highlights) em Zustand; persistência em
  `useLocalStorageGraph`.
- `specs/` (001, 002) contém documentação legada do SpeckIt — consultar
  quando necessário, não é parte ativa do build.

## 5. Segurança do .env

- `.env` e `.env.*` são git-ignored (`.gitignore`). Ficam na raiz.
- Variável em uso hoje: `VITE_TMDB_API_KEY`, lida em
  `src/services/tmdb.ts` via `import.meta.env.VITE_TMDB_API_KEY`.
- **Proibido** ao agente: ler, escrever, criar ou alterar `.env`; imprimir
  valor de chave/token; pedir que o usuário cole segredo; fazer dump de
  variáveis de ambiente inteiras.
- Credenciais ficam apenas em `.env`, nunca hardcoded.
- Se um recurso precisar de credencial ausente no `.env`, avise o usuário
  para configurá-la manualmente — não tente descobrir/criar o valor.
- Se criar `.env.example`, inclua só os nomes das variáveis, sem valores.

## 6. Sistema de documentação

- Toda informação nova e durável (decisão, API mapeada, gotcha, convenção)
  vira ou atualiza um arquivo em `docs/` — nunca é escrita direto neste
  `AGENTS.md`.
- Antes de investigar algo, cheque se já está documentado em `docs/`.
- `docs/MEMORIES.md` guarda a memória durável do projeto.
- `PLANS.md` (raiz) guarda plano + progresso de tarefas longas (>30min ou
  multi-sessão).

## 7. Context7 MCP

Use para documentação de biblioteca/API quando necessário. Fixe a versão.
Resuma — nunca cole a doc inteira no contexto.

### Quando e o que pesquisar

- Antes de escrever/alterar código que use biblioteca, framework, SDK,
  API ou CLI (ex.: Playwright, Puppeteer, dotenv, express) — mesmo se
  "achar" que sabe a resposta.
- Sintaxe de API, parâmetros/opções, exemplos de código,
  setup/configuração, migração ou debug específico de biblioteca.
- Fixe a versão em uso sempre que relevante.

### Exemplos de uso do context7

```powershell
# Setup do context7 CLI
npx ctx7 setup --opencode

# Sessão autenticada (mostrada após o setup):
# √ How should your agent access Context7? CLI + Skills
# ✔ Authenticated
# √ Downloaded find-docs skill
# √ Context7 CLI setup complete
#
# OpenCode
#   + Skill installed
#     C:\Users\eliog\.agents\skills\find-docs
#   + Rule updated
#     C:\Users\eliog\.config\opencode\AGENTS.md

# Uso típico — pesquisar documentação de uma biblioteca:
npx ctx7 library "Express.js" "routing"
npx ctx7 docs /org/express/v4.19.2 "middleware syntax"
```

### Quando NÃO pesquisar

- Lógica de negócio do projeto, refatoração, code review, conceitos
  genéricos de programação.

### Como usar (obrigatório)

1. `resolve-library-id` com o nome oficial da biblioteca + o que se quer
   fazer (só pule se já tiver o ID exato `/org/project`).
2. Escolha o melhor match: nome exato, relevância, fonte confiável, e ID
   de versão se citada.
3. `query-docs` com o ID e UM conceito por chamada — tópicos múltiplos =
   chamadas separadas, nunca juntar.
4. Analise a doc retornada e responda em resumo, com exemplo conciso.
   Nunca cole a doc inteira no contexto.

## Rastreamento (tarefa >30min ou multi-sessão)

Atualizar `PLANS.md` (plano + progresso) e `docs/MEMORIES.md` (memória
durável) na raiz.

## Definição de pronto

- Loop de entrega completo (verificação passou).
- Impacto explicado: o quê, onde, por quê.
- Commit feito.
- Pendências listadas se algo ficou de fora de propósito.

Só termine quando terminar.

## Segredos

- Nunca imprimir token/senha/credencial de conta no terminal ou no chat.
- Nunca pedir para o usuário colar segredo.
- Nunca fazer dump de variáveis de ambiente inteiras.
- Credenciais de conta ficam em `.env` (git-ignored), nunca hardcoded.
- Tokens de worker↔dashboard também ficam em `.env`, com trava de acesso
  restrito na VPS.
