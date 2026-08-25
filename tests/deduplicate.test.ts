import { describe, it, expect } from "vitest";
import { deduplicate } from "../src/utils/deduplicate";

describe("deduplicate", () => {
  it("remove itens duplicados pela chave", () => {
    const items = [
      { id: "1", name: "a" },
      { id: "2", name: "b" },
      { id: "1", name: "a" },
    ];
    const result = deduplicate(items, (item) => item.id);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("mantém a primeira ocorrência de cada chave", () => {
    const items = [
      { id: "a", v: 1 },
      { id: "b", v: 2 },
      { id: "a", v: 3 },
    ];
    const result = deduplicate(items, (item) => item.id);
    expect(result[0]).toEqual({ id: "a", v: 1 });
  });

  it("retorna array vazio para entrada vazia", () => {
    expect(deduplicate([], (i) => String(i))).toEqual([]);
  });

  it("funciona com tipos primitivos usando chave == valor", () => {
    const result = deduplicate([1, 2, 2, 3, 1], (n) => String(n));
    expect(result).toEqual([1, 2, 3]);
  });
});
