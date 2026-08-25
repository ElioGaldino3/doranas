# Memórias do projeto

Memória durável: decisões, APIs mapeadas, gotchas e convenções.
Registre aqui toda informação nova e durável em vez de repetir no
`AGENTS.md`. Antes de investigar, confira se já consta aqui.

## Registros

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
