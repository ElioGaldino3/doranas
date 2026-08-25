import { describe, it, expect } from "vitest";
import { computeStats, TOP_ACTORS_N } from "../src/utils/stats";
import type { CastMember, DoramaRecord } from "../src/types/models";

function member(personId: string, opts: Partial<CastMember> = {}): CastMember {
  return {
    personId,
    name: personId,
    order: 0,
    protagonist: false,
    ...opts,
  };
}

function dorama(id: string, year: number | null, cast: CastMember[]): DoramaRecord {
  return { id, title: id, year, addedAt: 1, cast };
}

describe("computeStats", () => {
  it("catálogo vazio retorna zeros e listas vazias", () => {
    const s = computeStats([]);
    expect(s.doramaCount).toBe(0);
    expect(s.actorCount).toBe(0);
    expect(s.appearanceCount).toBe(0);
    expect(s.protagonistCount).toBe(0);
    expect(s.topActors).toEqual([]);
    expect(s.byYear).toEqual([]);
  });

  it("contabiliza totais e top atores (limitado a TOP_ACTORS_N)", () => {
    const doramas = [
      dorama("d1", 2019, [member("a", { protagonist: true }), member("b")]),
      dorama("d2", 2020, [member("a"), member("c", { protagonist: true })]),
    ];
    const s = computeStats(doramas);
    expect(s.doramaCount).toBe(2);
    expect(s.actorCount).toBe(3); // a, b, c
    expect(s.appearanceCount).toBe(4);
    expect(s.protagonistCount).toBe(2); // a e c
    expect(s.topActors.length).toBeLessThanOrEqual(TOP_ACTORS_N);
    // "a" aparece 2x e lidera
    expect(s.topActors[0].personId).toBe("a");
    expect(s.topActors[0].appearances).toBe(2);
  });

  it("conta ator canônico único quando há merge manual via alias", () => {
    // Mesmo ator físico: TMDB-only "123" num dorama e só-Wikidata "Q678" noutro.
    const doramas = [
      dorama("d1", 2019, [member("123")]),
      dorama("d2", 2020, [member("Q678", { wikidataId: "Q678" })]),
    ];
    expect(computeStats(doramas).actorCount).toBe(2);
    expect(computeStats(doramas, { "123": "Q678" }).actorCount).toBe(1);
  });

  it("agrega doramas por ano, com '—' por último e ordenado", () => {
    const doramas = [
      dorama("d1", 2019, [member("a")]),
      dorama("d2", 2019, [member("b")]),
      dorama("d3", 2021, [member("c")]),
      dorama("d4", null, [member("d")]),
    ];
    const s = computeStats(doramas);
    expect(s.byYear).toEqual([
      { year: 2019, count: 2 },
      { year: 2021, count: 1 },
      { year: "—", count: 1 },
    ]);
  });
});
