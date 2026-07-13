import jsPDF from "jspdf";
import type { Node, Link } from "../types/graph";

function getLinkId(ref: string | any): string {
  return typeof ref === "object" && ref !== null ? ref.id : ref;
}

export function exportGraphToPdf(nodes: Node[], links: Link[]) {
  const doramas = nodes.filter((n) => n.group === "dorama");
  if (doramas.length === 0) return;

  const linksByTarget = new Map<string, number>();
  for (const link of links) {
    const target = getLinkId(link.target);
    linksByTarget.set(target, (linksByTarget.get(target) ?? 0) + 1);
  }

  const pdf = new jsPDF("p", "mm", "a4");
  const pw = pdf.internal.pageSize.getWidth();

  let y = 20;

  pdf.setTextColor(245, 158, 11);
  pdf.setFontSize(20);
  pdf.text("DoramaActors", 14, y);
  y += 7;
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(10);
  pdf.text(`Exportado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, y);
  y += 6;
  pdf.text(`Total: ${doramas.length} dorama${doramas.length > 1 ? "s" : ""} assistido${doramas.length > 1 ? "s" : ""}`, 14, y);
  y += 10;

  const marginLeft = 14;
  const marginRight = 14;
  const colW = (pw - marginLeft - marginRight - 20) / 2;
  const colNumW = 10;
  const colTitleW = pw - marginLeft - marginRight - colNumW - colW - 10;
  pdf.setFontSize(9);
  pdf.setTextColor(148, 163, 184);

  const headerY = y;
  pdf.text("#", marginLeft + 2, headerY);
  pdf.text("T\u00edtulo", marginLeft + colNumW + 4, headerY);
  pdf.text("Atores", marginLeft + colNumW + colTitleW + 6, headerY);
  y = headerY + 6;

  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.3);
  pdf.line(marginLeft, y - 1, pw - marginRight, y - 1);

  pdf.setTextColor(55, 65, 81);
  pdf.setFontSize(8);

  for (let i = 0; i < doramas.length; i++) {
    const d = doramas[i];
    const actorCount = linksByTarget.get(d.id) ?? 0;

    if (y > 275) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(String(i + 1), marginLeft + 2, y);
    pdf.text(d.label, marginLeft + colNumW + 4, y);
    pdf.text(String(actorCount), marginLeft + colNumW + colTitleW + 6, y);

    pdf.setDrawColor(255, 255, 255, 0.06);
    pdf.setLineWidth(0.1);
    pdf.line(marginLeft, y + 1, pw - marginRight, y + 1);

    y += 6;
  }

  pdf.setDrawColor(245, 158, 11);
  pdf.setLineWidth(0.3);
  pdf.line(marginLeft, y - 1, pw - marginRight, y - 1);

  y += 4;
  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(8);
  pdf.text(`Total de atores: ${nodes.filter((n) => n.group === "actor").length}`, marginLeft, y);

  pdf.save("doramas-assistidos.pdf");
}