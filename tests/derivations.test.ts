import { describe, it, expect } from "vitest";
import {
  applyProtagonistHeuristic,
  tmdbCastToMembers,
  mergeCast,
  actorsByAppearance,
  otherDoramasOf,
  doramasOfPerson,
  doramaFromTmdb,
  enrichDoramaWithWikidata,
  actorIds,
  buildCanonicalIdMap,
  canonicalId,
  resolveAlias,
} from "../src/utils/derivations";
import type { CastMember, DoramaRecord } from "../src/types/models";
import type { CastResult, SeriesDetails } from "../src/types/tmdb";
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

describe("doramaFromTmdb", () => {
  const details = (overrides?: Partial<SeriesDetails>): SeriesDetails => ({
    id: 42,
    name: "Crash Landing on You",
    first_air_date: "2019-12-14",
    overview: "Sinopse",
    poster_path: "/p42.jpg",
    ...overrides,
  });

  const cast4: CastResult[] = [
    { id: 1, name: "A", profile_path: "/a.jpg", character: "..." },
    { id: 2, name: "B", profile_path: null, character: "..." },
    { id: 3, name: "C", profile_path: null, character: "..." },
    { id: 4, name: "D", profile_path: null, character: "..." },
  ];

  it("monta o record v2 com ano, poster e wikidataId null", () => {
    const rec = doramaFromTmdb(details(), cast4, (p) => `https://img${p}`);
    expect(rec.id).toBe("42");
    expect(rec.title).toBe("Crash Landing on You");
    expect(rec.year).toBe(2019);
    expect(rec.posterUrl).toBe("https://img/p42.jpg");
    expect(rec.wikidataId).toBeNull();
    expect(rec.cast).toHaveLength(4);
  });

  it("marca protagonistas pelos N primeiros do billing", () => {
    const rec = doramaFromTmdb(details(), cast4);
    const protags = rec.cast.filter((m) => m.protagonist).map((m) => m.personId);
    expect(protags).toEqual(["1", "2", "3"]);
    expect(rec.cast[3].order).toBe(3);
    expect(rec.cast[3].protagonist).toBe(false);
  });

  it("year null quando não há first_air_date", () => {
    const rec = doramaFromTmdb(details({ first_air_date: null }), cast4);
    expect(rec.year).toBeNull();
  });
});

describe("enrichDoramaWithWikidata", () => {
  const base: DoramaRecord = {
    id: "42",
    title: "Dorama",
    year: 2020,
    addedAt: 1,
    wikidataId: null,
    cast: [member("1", 0), member("2", 1)],
  };
  const wikiRows: WikidataCastRow[] = [
    { qid: "Q1", name: "Ator 1", tmdbPersonId: "1" },
    { qid: "Q99", name: "Novo do Wikidata" },
  ];

  it("seta wikidataId, enriquece membros TMDB e adiciona ator só-Wikidata", () => {
    const out = enrichDoramaWithWikidata(base, "Q42", wikiRows);
    expect(out.wikidataId).toBe("Q42");
    expect(out.cast).toHaveLength(3);
    expect(out.cast.find((c) => c.personId === "1")?.wikidataId).toBe("Q1");
    expect(out.cast.find((c) => c.personId === "Q99")).toMatchObject({
      order: null,
      protagonist: false,
    });
  });

  it("é idempotente — re-executar não duplica atores", () => {
    const once = enrichDoramaWithWikidata(base, "Q42", wikiRows);
    const twice = enrichDoramaWithWikidata(once, "Q42", wikiRows);
    expect(twice.cast).toHaveLength(3);
    expect(twice.wikidataId).toBe("Q42");
  });

  it("não muta o input", () => {
    const out = enrichDoramaWithWikidata(base, "Q42", wikiRows);
    expect(base.wikidataId).toBeNull();
    expect(base.cast).toHaveLength(2);
    expect(out).not.toBe(base);
  });
});

describe("deduplicação de atores (id canônico)", () => {
  // Mesmo ator físico aparece com `personId` divergente entre doramas: no
  // dorama d1 vem do TMDB (personId "123") e ganhou wikidataId "Q678" na
  // migração; no dorama d2 vem só do Wikidata (personId "Q678").
  const splitActor = (): CastMember => ({ personId: "123", name: "Ator Split", order: 0, protagonist: false, wikidataId: "Q678" });
  const wikiOnly = (): CastMember => ({ personId: "Q678", name: "Ator Split", order: null, protagonist: false, wikidataId: "Q678" });

  const doramas: DoramaRecord[] = [
    { id: "d1", title: "D1", addedAt: 1, cast: [splitActor(), member("other", 1)] },
    { id: "d2", title: "D2", addedAt: 2, cast: [wikiOnly()] },
    { id: "d3", title: "D3", addedAt: 3, cast: [member("Q999", 0)] }, // ator distinto
  ];

  it("actorIds prioriza wikidataId quando presente", () => {
    expect(actorIds(splitActor())).toEqual(["Q678", "123"]);
    expect(actorIds(member("42", 0))).toEqual(["42"]);
  });

  it("buildCanonicalIdMap unifica TMDB id e QID do mesmo ator", () => {
    const map = buildCanonicalIdMap(doramas);
    expect(map.get("123")).toBe("Q678");
    expect(map.get("Q678")).toBe("Q678");
  });

  it("canonicalId é estável e consistente entre entradas do mesmo ator", () => {
    const map = buildCanonicalIdMap(doramas);
    expect(canonicalId(splitActor(), map)).toBe("Q678");
    expect(canonicalId(wikiOnly(), map)).toBe("Q678");
  });

  it("actorsByAppearance unifica o ator splitado em 1 entrada (2 aparições)", () => {
    const actors = actorsByAppearance(doramas);
    const split = actors.find((a) => a.personId === "Q678");
    expect(split).toBeDefined();
    expect(split!.appearances).toBe(2);
    expect(split!.doramaIds.sort()).toEqual(["d1", "d2"]);
    // O ator distinto (Q999) continua separado.
    expect(actors.find((a) => a.personId === "Q999")?.appearances).toBe(1);
    // Total de atores agregados = 3 (split + other + Q999).
    expect(actors).toHaveLength(3);
  });

  it("doramasOfPerson lista ambos os doramas do ator splitado", () => {
    const all = doramasOfPerson(doramas, "Q678").sort((a, b) => a.id.localeCompare(b.id));
    expect(all.map((d) => d.id)).toEqual(["d1", "d2"]);
  });

  it("otherDoramasOf cruza o split entre doramas via id canônico", () => {
    const others = otherDoramasOf(doramas, "Q678", "d1");
    expect(others).toEqual([{ id: "d2", title: "D2", protagonist: false }]);
  });

  it("não funde atores de verdade distintos", () => {
    const map = buildCanonicalIdMap(doramas);
    expect(canonicalId(member("Q999", 0), map)).toBe("Q999");
  });
});

describe("resolveAlias", () => {
  it("retorna o próprio id quando não há alias", () => {
    expect(resolveAlias("123", {})).toBe("123");
  });

  it("segue a cadeia source → target até o terminal", () => {
    expect(resolveAlias("123", { "123": "456", "456": "Q9" })).toBe("Q9");
  });

  it("interrompe ciclos sem travar", () => {
    expect(resolveAlias("a", { a: "b", b: "a" })).toBe("a");
  });
});

describe("merge manual de atores via actorAliases", () => {
  // Limitação da Fase 5: o mesmo ator físico aparece em doramas diferentes
  // SEM nenhum id compartilhado — TMDB-only ("123") num e só-Wikidata ("Q678")
  // noutro. O dedup automático não os une; o merge manual (alias) resolve.
  const tmdbOnly = (): CastMember => ({
    personId: "123",
    name: "Ator X",
    order: 0,
    protagonist: false,
  });
  const wikiOnly = (): CastMember => ({
    personId: "Q678",
    name: "Ator X",
    order: null,
    protagonist: false,
    wikidataId: "Q678",
  });

  const doramas: DoramaRecord[] = [
    { id: "d1", title: "D1", addedAt: 1, cast: [tmdbOnly(), member("other", 1)] },
    { id: "d2", title: "D2", addedAt: 2, cast: [wikiOnly()] },
  ];

  it("sem alias, ator TMDB-only e só-Wikidata permanecem separados", () => {
    const actors = actorsByAppearance(doramas, {});
    expect(actors).toHaveLength(3); // 123, Q678, other
  });

  it("com alias 123→Q678, unifica em 1 entrada (2 aparições)", () => {
    const aliases = { "123": "Q678" };
    const actors = actorsByAppearance(doramas, aliases);
    const merged = actors.find((a) => a.personId === "Q678");
    expect(merged).toBeDefined();
    expect(merged!.appearances).toBe(2);
    expect(merged!.doramaIds.sort()).toEqual(["d1", "d2"]);
  });

  it("doramasOfPerson cruza o merge manual entre doramas", () => {
    const all = doramasOfPerson(doramas, "Q678", { "123": "Q678" }).sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    expect(all.map((d) => d.id)).toEqual(["d1", "d2"]);
  });

  it("otherDoramasOf cruza o merge manual via id canônico", () => {
    const others = otherDoramasOf(doramas, "Q678", "d1", { "123": "Q678" });
    expect(others).toEqual([{ id: "d2", title: "D2", protagonist: false }]);
  });
});
