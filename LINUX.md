# Ambiente de desenvolvimento — Linux (bash)

Setup e comandos para trabalhar neste repositório no Linux usando bash.
Requisitos: Node.js (LTS, com npm) instalado.

## Instalação

```bash
# Na raiz do repositório
npm install
```

## Comandos

| Tarefa        | Comando              |
|---------------|----------------------|
| Dev server    | `npm run dev`        |
| Typecheck     | `npx tsc -b`         |
| Lint          | `npm run lint`       |
| Build         | `npm run build`      |
| Preview       | `npm run preview`    |
| Testes        | não configurado ainda |

Filtre sempre o output dos comandos ao que importa (erros/resumos).

## Observações

- O projeto roda no Node (não há nada específico de Linux no código).
- Variáveis de ambiente (`.env`) são git-ignored e configuradas
  manualmente; não devem ser lidas/alteradas por agentes.
