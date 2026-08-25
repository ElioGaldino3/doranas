import jsPDF from "jspdf";
import type { Node, Link } from "../types/graph";

/**
 * Dados de entrada do exportador, já desacoplados do modelo de grafo.
 * No modelo v2 (catalogStore), os doramas fornecem diretamente nível,
 * título, ano e contagem real de atores do elenco (não derivado de links).
 */
export interface ExportDorama {
  id: string;
  title: string;
  year?: number | null;
  actorCount: number;
}

interface ColumnLayout {
  numW: number;
  titleX: number;
  titleW: number;
  countW: number;
  countRightX: number;
}

const MARGIN_L = 14;
const MARGIN_R = 14;
const PAGE_BOTTOM_LIMIT = 275; // A4: 297mm de altura; margem inferior ~22mm
const TOP = 20;

const COLORS = {
  accent: [245, 158, 11] as const, // amber-500
  muted: [148, 163, 184] as const, // slate-400
  text: [55, 65, 81] as const, // slate-700
  grid: [255, 255, 255, 0.06] as const, // linha de separação (sutil)
};

/** Calcula as colunas "num | título | atores" cabendo na largura da página. */
function buildColumns(pageWidth: number): ColumnLayout {
  const numW = 10;
  const gap = 6;
  // Largura real da área útil após "num" e marcadores de coluna
  const usable = pageWidth - MARGIN_L - MARGIN_R - numW - 2 * gap;
  const countW = 18; // coluna "Atores" (nº de atores)
  const titleW = usable - countW;

  return {
    numW,
    titleX: MARGIN_L + numW + gap * 0.5 + 2,
    titleW,
    countW,
    countRightX: pageWidth - MARGIN_R - 2, // alinhado à direita
  };
}

/**
 * Desenha o cabeçalho (título do app + rodapé de data) e retorna a posição y
 * de início do corpo. Reutilizado em cada nova página.
 */
function drawHeader(pdf: jsPDF, doramaCount: number): void {
  pdf.setTextColor(...COLORS.accent);
  pdf.setFontSize(20);
  pdf.text("DoramaActors", MARGIN_L, TOP);

  pdf.setTextColor(...COLORS.muted);
  pdf.setFontSize(10);
  pdf.text(
    `Exportado em: ${new Date().toLocaleDateString("pt-BR")}`,
    MARGIN_L,
    TOP + 7,
  );
  pdf.text(
    `Total: ${doramaCount} dorama${doramaCount !== 1 ? "s" : ""}`,
    MARGIN_L,
    TOP + 13,
  );
}

/** Desenha a linha de cabeçalho das colunas (#, Título, Atores). */
function drawColumnHeader(pdf: jsPDF, cols: ColumnLayout, y: number): number {
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.text("#", MARGIN_L + 2, y);
  pdf.text("T\u00edtulo", cols.titleX, y);
  pdf.text("Atores", cols.countRightX - 8, y); // alinhado perto da coluna

  const lineY = y + 4;
  pdf.setDrawColor(...COLORS.accent);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_L, lineY, MARGIN_L + cols.numW + cols.titleW + cols.countW + 8, lineY);

  return y + 6;
}

/**
 * Desenha o rodapé com o total de atores. Chamado no fim OU antes de quebrar
 * página, para que a informação não se perca.
 */
function drawFooter(pdf: jsPDF, totalActors: number, y: number): number {
  const yAfter = y + 4;
  pdf.setDrawColor(...COLORS.accent);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_L, y + 1, MARGIN_L + 130, y + 1);

  pdf.setTextColor(...COLORS.muted);
  pdf.setFontSize(8);
  pdf.text(`Total de atores: ${totalActors}`, MARGIN_L, yAfter);
  return yAfter;
}

function titleLines(pdf: jsPDF, title: string, maxWidth: number): string[] {
  return pdf.splitTextToSize(title, maxWidth);
}

/**
 * Exporta uma lista de doramas para PDF (A4). Fonte de dados é o catálogo
 * v2 (id, título, ano, nº de atores) — independe do modelo de grafo.
 *
 * Limitação conhecida: jsPDF com a fonte padrão helvetica só cobre latin-1;
 * títulos em coreano/japonês podem sair como caracteres ilegíveis. Para
 * suporte CJK completo seria preciso registrar uma fonte WOFF (fase futura).
 *
 * Retorna o documento gerado para permitir testes; o download é feito pelo
 * chamador.
 */
export function buildDoramaPdf(doramas: ExportDorama[]): jsPDF {
  if (doramas.length === 0) {
    throw new Error("Nenhum dorama para exportar");
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const cols = buildColumns(pdf.internal.pageSize.getWidth());

  drawHeader(pdf, doramas.length);
  let y = drawColumnHeader(pdf, cols, TOP + 18);

  const totalActors = doramas.reduce((acc, d) => acc + d.actorCount, 0);

  for (let i = 0; i < doramas.length; i++) {
    const d = doramas[i];

    // Quebra de página: repinta cabeçalho e colunas na nova página.
    if (y > PAGE_BOTTOM_LIMIT) {
      pdf.addPage();
      drawHeader(pdf, doramas.length);
      y = drawColumnHeader(pdf, cols, TOP + 18);
    }

    const label = d.year ? `${d.title} (${d.year})` : d.title;
    const lines = titleLines(pdf, label, cols.titleW);

    if (lines.length > 0) {
      pdf.setTextColor(...COLORS.text);
      pdf.setFontSize(8);
      pdf.text(String(i + 1), MARGIN_L + 2, y);

      const titleY = y;
      lines.forEach((line, lineIdx) => {
        // sem quebrar no meio; se exceder o limite, deixa o loop fluxo tratar
        pdf.text(line, cols.titleX, titleY + lineIdx * 4);
      });

      pdf.text(String(d.actorCount), cols.countRightX, y);
      lines.forEach((_line, lineIdx) => {
        pdf.setDrawColor(...COLORS.grid);
        pdf.setLineWidth(0.1);
        pdf.line(MARGIN_L, y + 1 + lineIdx * 4, cols.countRightX + 10, y + 1 + lineIdx * 4);
      });

      y += lines.length * 4 + 4;
    } else {
      y += 5;
    }
  }

  drawFooter(pdf, totalActors, y);
  return pdf;
}

/**
 * Adaptador temporário que converte o modelo de grafo v1 (Node/Link) para a
 * lista v2 e exporta. Mantido até a Fase 4 substituir o Sidebar pelo catálogo.
 */
export function exportGraphToPdf(nodes: Node[], links: Link[]): void {
  const doramaNodes = nodes.filter((n) => n.group === "dorama");
  // Comportamento tolerante (compat com o Sidebar v1): sem doramas, não faz nada.
  if (doramaNodes.length === 0) {
    return;
  }

  // Conta atores por dorama considerando links no formato do grafo v1
  // (actor -> dorama): o target do link é o id do dorama.
  const actorCountByDorama = new Map<string, number>();
  for (const link of links) {
    const target = linkId(link.target);
    actorCountByDorama.set(target, (actorCountByDorama.get(target) ?? 0) + 1);
  }

  const doramas: ExportDorama[] = doramaNodes.map((node) => ({
    id: node.id,
    title: node.label,
    year: undefined,
    actorCount: actorCountByDorama.get(node.id) ?? 0,
  }));

  const pdf = buildDoramaPdf(doramas);
  pdf.save("doramas-assistidos.pdf");
}

/** Normaliza o target de um link (string ou objeto com `id`). */
function linkId(ref: string | { id?: unknown }): string {
  if (typeof ref === "object" && ref !== null && ref.id != null) {
    return String(ref.id);
  }
  return String(ref);
}
