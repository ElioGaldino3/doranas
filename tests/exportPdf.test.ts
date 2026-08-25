import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import jsPDF from "jspdf";
import {
  buildDoramaPdf,
  registerCjkFont,
  loadCjkFont,
  type ExportDorama,
} from "../src/utils/exportPdf";

afterEach(() => vi.unstubAllGlobals());

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

describe("cjkFont (títulos coreano/japonês)", () => {
  it("registra a fonte TTF e renderiza título em hangul sem lançar", () => {
    const binary = readFileSync(
      resolve("public/fonts/NanumGothic-Regular.ttf"),
      "latin1",
    );
    const pdf = buildDoramaPdf(
      [
        {
          id: "1",
          title: "사랑의 불시착 (Crash Landing on You)",
          year: 2019,
          actorCount: 5,
        },
      ],
      { cjkFont: binary },
    );
    expect(Object.keys(pdf.getFontList())).toContain("NanumGothic");
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });

  it("registerCjkFont adiciona a fonte ao documento", () => {
    const binary = readFileSync(
      resolve("public/fonts/NanumGothic-Regular.ttf"),
      "latin1",
    );
    const pdf = new jsPDF();
    registerCjkFont(pdf, binary);
    expect(Object.keys(pdf.getFontList())).toContain("NanumGothic");
  });
});

describe("loadCjkFont", () => {
  it("busca o TTF uma única vez e cacheia a binary string", async () => {
    const fetchMock = vi.fn(async () => new Response(new Uint8Array([65, 66, 67])));
    vi.stubGlobal("fetch", fetchMock);

    const first = await loadCjkFont();
    const second = await loadCjkFont();

    expect(first).toBe("ABC");
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
