import { describe, it, expect } from "vitest";
import { sortDoramas, filterDoramas, type DoramaSort } from "../src/utils/catalogView";
import type { DoramaRecord } from "../src/types/models";

function d(id: string, title: string, year: number | null, addedAt: number): DoramaRecord {
  return { id, title, year, addedAt, cast: [] };
}

const list = [
  d("3", "Crash Landing on You", 2019, 300),
  d("1", "Água de Beber", 2021, 100),
  d("2", "Zona Norte", null, 200),
];

describe("sortDoramas", () => {
  it("recent: addedAt desc", () => {
    expect(sortDoramas(list, "recent").map((x) => x.id)).toEqual(["3", "2", "1"]);
  });

  it("title: colação pt-BR ignora acento (Á antes de C e Z)", () => {
    expect(sortDoramas(list, "title").map((x) => x.id)).toEqual(["1", "3", "2"]);
  });

  it("year: asc com nulo por último", () => {
    expect(sortDoramas(list, "year").map((x) => x.id)).toEqual(["3", "1", "2"]);
  });

  it("não muta a entrada", () => {
    const copy = [...list];
    sortDoramas(list, "title");
    expect(list).toEqual(copy);
  });

  it("default (sortBy inválido) trata como recent", () => {
    expect(sortDoramas(list, "recent" as DoramaSort).map((x) => x.id)).toEqual(["3", "2", "1"]);
  });
});

describe("filterDoramas", () => {
  it("query vazia retorna a lista original", () => {
    expect(filterDoramas(list, "   ")).toBe(list);
  });

  it("filtra por substring case-insensitive no título", () => {
    const r = filterDoramas(list, "crash");
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe("3");
  });

  it("sem correspondência retorna lista vazia", () => {
    expect(filterDoramas(list, "xyz")).toHaveLength(0);
  });
});
