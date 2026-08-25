# Ambiente de desenvolvimento — Windows (PowerShell)

Setup e comandos para trabalhar neste repositório no Windows usando
PowerShell. Requisitos: Node.js (LTS, com npm) instalado.

## Instalação

```powershell
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
| Testes        | `npm test`           |
| Testes (watch)| `npm run test:watch` |

Filtre sempre o output dos comandos ao que importa (erros/resumos).

## Observações

- O projeto roda no Node (não há nada específico de Windows no código).
- Variáveis de ambiente (`.env`) são git-ignored e configuradas
  manualmente; não devem ser lidas/alteradas por agentes.
- Se o `npm install` falhar com permissão, rode o PowerShell como
  administrador ou ajuste a política de execução se necessário.
