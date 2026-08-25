import { describe, it, expect } from "vitest";
import {
  applyProtagonistHeuristic,
  tmdbCastToMembers,
  mergeCast,
  actorsByAppearance,
  otherDoramasOf,
  doramasOfPerson,
} from "../src/utils/derivations";
import type { CastMember, DoramaRecord } from "../src/types/models";
import type { CastResult } from "../src/types/tmdb";
import type { WikidataCastRow } from "../src/types/wikidata";

const member = (personId: string, order: number | null): CastMember => ({
  personId,
  name: personId,
  order,
  protagonist: false,
});

describe("applyProtagonistHeuristic", () => {
  it("marca como protagonista os primeiros N do billing", () => {
    const cast = [member("a", 0), member("b", 1), member("c", 2), member("d", 3), member("e", 4)];
    const result = applyProtagonistHeuristic(cast, 3);
    expect(result.filter((m) => m.protagonist).map((m) => m.personId)).toEqual(["a", "b", "c"]);
  });

  it("nunca marca atores sem billing (order null) como protagonista", () => {
    const cast = [member("x", null), member("y", 0)];
    const result = applyProtagonistHeuristic(cast, 3);
    expect(result.find((m) => m.personId === "x")?.protagonist).toBe(false);
    expect(result.find((m) => m.personId === "y")?.protagonist).toBe(true);
  });
});

describe("tmdbCastToMembers", () => {
  it("preserva order = índice e resolve imagem via callback", () => {
    const cast: CastResult[] = [
      { id: 1, name: "A", profile_path: "/p1.jpg", character: "..." },
      { id: 2, name: "B", profile_path: null, character: "..." },
    ];
    const members = tmdbCastToMembers(cast, (p) => `https://img${p}`);
    expect(members[0].order).toBe(0);
    expect(members[0].profileImgUrl).toBe("https://img/p1.jpg");
    expect(members[1].order).toBe(1);
    expect(members[1].profileImgUrl).toBeUndefined();
  });
});

describe("mergeCast", () => {
  const tmdb = [member("1", 0), member("2", 1)];
  const wiki: WikidataCastRow[] = [
    { qid: "Q1", name: "Ator 1", tmdbPersonId: "1" }, // casa com TMDB
    { qid: "Q2", name: "Ator 2", tmdbPersonId: "2" }, // casa com TMDB
    { qid: "Q99", name: "Novo do Wikidata" }, // só Wikidata → deve entrar
  ];

  it("adiciona atores só-Wikidata com order null e deduplica os casados", () => {
    const merged = mergeCast(tmdb, wiki);
    expect(merged).toHaveLength(3);
    expect(merged[2]).toMatchObject({ personId: "Q99", order: null, wikidataId: "Q99" });
  });

  it("atribui wikidataId aos membros TMDB casados por TMDB person id", () => {
    const merged = mergeCast(tmdb, wiki);
    expect(merged[0].wikidataId).toBe("Q1");
    expect(merged[1].wikidataId).toBe("Q2");
  });
});

describe("actorsByAppearance", () => {
  const doramas: DoramaRecord[] = [
    { id: "d1", title: "D1", addedAt: 1, cast: [member("a", 0), member("b", 1)] },
    { id: "d2", title: "D2", addedAt: 2, cast: [member("a", 0), member("c", 1)] },
    { id: "d3", title: "D3", addedAt: 3, cast: [member("c", 0)] },
  ];

  it("ordena por nº de aparições desc e lista os doramas", () => {
    const actors = actorsByAppearance(doramas);
    // a=2, c=2, b=1 → a/c empatado(2) desempate nome; depois b(1)
    expect(actors[0].personId).toBe("a");
    expect(actors[0].appearances).toBe(2);
    expect(actors[0].doramaIds).toEqual(["d1", "d2"]);
    expect(actors[1].personId).toBe("c");
    expect(actors[1].appearances).toBe(2);
    expect(actors[2].personId).toBe("b");
    expect(actors[2].appearances).toBe(1);
  });
});

describe("otherDoramasOf / doramasOfPerson", () => {
  const doramas: DoramaRecord[] = [
    { id: "d1", title: "D1", addedAt: 1, cast: [{ ...member("a", 0), protagonist: true }] },
    { id: "d2", title: "D2", year: 2020, addedAt: 2, cast: [{ ...member("a", 2), protagonist: true }] },
    { id: "d3", title: "D3", addedAt: 3, cast: [member("x", 0)] },
  ];

  it("retorna outros doramas do ator excluindo o atual", () => {
    const others = otherDoramasOf(doramas, "a", "d1");
    expect(others).toEqual([{ id: "d2", title: "D2", protagonist: true }]);
  });

  it("doramasOfPerson lista todos os doramas do ator com protagonista", () => {
    const all = doramasOfPerson(doramas, "a");
    expect(all).toHaveLength(2);
    expect(all[1]).toMatchObject({ id: "d2", year: 2020, protagonist: true });
  });
});
