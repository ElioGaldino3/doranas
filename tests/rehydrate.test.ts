import { describe, it, expect, vi } from "vitest";
import { rehydrateDoramas } from "../src/services/rehydrate";
import type { RehydrateDeps } from "../src/services/rehydrate";
import type { DoramaRecord } from "../src/types/models";
import type { WikidataCastRow } from "../src/types/wikidata";

const dorama = (id: string, wikidataId?: string | null): DoramaRecord => ({
  id,
  title: `Dorama ${id}`,
  addedAt: 1,
  wikidataId: wikidataId ?? null,
  cast: [{ personId: "p1", name: "Ator", order: 0, protagonist: true }],
});

const wikiRows = (qid: string): WikidataCastRow[] => {
  const suffix = qid.replace(/^Q/, "");
  return [
    { qid: `Q${suffix}`, name: `Casa TMDB ${suffix}`, tmdbPersonId: "p1" },
    { qid: `QW${suffix}`, name: `Só Wiki ${suffix}` },
  ];
};

function makeDeps() {
  const resolveSeriesQids = vi.fn(async (ids: string[]) =>
    Object.fromEntries(ids.map((id) => [id, `Q${id}`])),
  );
  const fetchWikidataCast = vi.fn(async (qids: string[]) => {
    const map = new Map<string, WikidataCastRow[]>();
    for (const q of qids) map.set(q, wikiRows(q));
    return map;
  });
  const deps: RehydrateDeps = { resolveSeriesQids, fetchWikidataCast };
  return { deps, resolveSeriesQids, fetchWikidataCast };
}

describe("rehydrateDoramas", () => {
  it("processa só pendentes (wikidataId null) e preserva a ordem", async () => {
    const { deps, resolveSeriesQids } = makeDeps();
    const resolved = dorama("1", "Q1");
    const pending = dorama("2");

    const result = await rehydrateDoramas([resolved, pending], deps);

    expect(result.updatedCount).toBe(1);
    expect(result.updated.map((d) => d.id)).toEqual(["2"]);
    expect(result.skippedCount).toBe(1);
    expect(result.doramas.map((d) => d.id)).toEqual(["1", "2"]);
    expect(result.doramas[1].wikidataId).toBe("Q2");
    // reservou apenas os pendentes no lote de resolução
    expect(resolveSeriesQids).toHaveBeenCalledWith(["2"]);
  });

  it("sem pendentes → não chama rede", async () => {
    const { deps, resolveSeriesQids, fetchWikidataCast } = makeDeps();
    const result = await rehydrateDoramas([dorama("1", "Q1")], deps);

    expect(result.updatedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(resolveSeriesQids).not.toHaveBeenCalled();
    expect(fetchWikidataCast).not.toHaveBeenCalled();
  });

  it("enriquece o elenco com atores só-Wikidata (order null)", async () => {
    const { deps } = makeDeps();
    const result = await rehydrateDoramas([dorama("2")], deps);

    const updated = result.updated[0];
    expect(updated.wikidataId).toBe("Q2");
    // p1 enriquecido com QID + ator só-Wikidata (casamentos não duplicam)
    expect(updated.cast).toHaveLength(2);
    expect(updated.cast.find((c) => c.personId === "p1")?.wikidataId).toBe("Q2");
    const onlyWiki = updated.cast.find((c) => c.personId === "QW2");
    expect(onlyWiki).toBeDefined();
    expect(onlyWiki!.order).toBeNull();
    expect(onlyWiki!.protagonist).toBe(false);
  });

  it("dorama sem QID no Wikidata permanece como está (cobertura incompleta)", async () => {
    const { deps, resolveSeriesQids } = makeDeps();
    resolveSeriesQids.mockResolvedValue({});
    const pending = dorama("2");

    const result = await rehydrateDoramas([pending], deps);

    expect(result.updatedCount).toBe(0);
    expect(result.doramas[0]).toBe(pending);
    // sem labels resolvidos, não consulta elenco
    expect(deps.fetchWikidataCast).not.toHaveBeenCalled();
  });

  it("falha de lote propaga o erro sem mutar o estado", async () => {
    const { deps, resolveSeriesQids } = makeDeps();
    resolveSeriesQids.mockRejectedValue(new Error("quota atingida"));
    const input = [dorama("1"), dorama("2")];

    await expect(rehydrateDoramas(input, deps)).rejects.toThrow("quota");

    // inputs intactos (mesmas referências)
    expect(input[0].wikidataId).toBeNull();
    expect(input[1].wikidataId).toBeNull();
  });

  it("reporta progresso via onProgress", async () => {
    const { deps } = makeDeps();
    const calls: [number, number][] = [];
    deps.onProgress = (done, total) => calls.push([done, total]);

    await rehydrateDoramas([dorama("1"), dorama("2"), dorama("3")], deps);

    expect(calls.map((c) => c[0])).toEqual([0, 1, 2]);
    expect(calls.every(([, total]) => total === 3)).toBe(true);
  });
});