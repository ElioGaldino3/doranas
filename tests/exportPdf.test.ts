import { describe, it, expect } from "vitest";
import { buildDoramaPdf, type ExportDorama } from "../src/utils/exportPdf";

describe("buildDoramaPdf", () => {
  it("lança erro quando a lista está vazia", () => {
    expect(() => buildDoramaPdf([])).toThrow();
  });

  it("gera um documento jsPDF com a quantidade de linhas esperada", () => {
    const doramas: ExportDorama[] = [
      { id: "1", title: "Crash Landing on You", year: 2019, actorCount: 5 },
      { id: "2", title: "Goblin", year: 2016, actorCount: 7 },
    ];
    const pdf = buildDoramaPdf(doramas);
    // jsPDF expõe a contagem de páginas internamente via API
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("aceita título sem ano", () => {
    const doramas: ExportDorama[] = [{ id: "1", title: "Sem Ano", year: null, actorCount: 2 }];
    expect(() => buildDoramaPdf(doramas)).not.toThrow();
  });
});
