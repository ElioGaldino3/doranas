import { describe, it, expect, vi, beforeEach } from "vitest";
import { migrateIfNeeded, type MigrationDeps } from "../src/services/migration";
import { STORAGE_KEY } from "../src/services/persistence";
import type { StorageLike } from "../src/services/persistence";
import type { SeriesDetails, CastResult } from "../src/types/tmdb";
import type { WikidataCastRow } from "../src/types/wikidata";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const v1Doc = (ids: string[]) => ({
  nodes: ids.map((id) => ({ id, label: `Dorama ${id}`, group: "dorama" as const, imgUrl: "" })),
  links: [],
  updatedAt: 1,
});

const details = (id: string): SeriesDetails => ({
  id: Number(id),
  name: `Titulo ${id}`,
  first_air_date: "2020-01-01",
  overview: `Texto ${id}`,
  poster_path: `/p${id}.jpg`,
});

const cast = (id: string): CastResult[] => [
  { id: Number(id) * 100 + 1, name: "Ator A", profile_path: "/a.jpg", character: "..." },
  { id: Number(id) * 100 + 2, name: "Ator B", profile_path: null, character: "..." },
];

interface FakeCtx {
  storage: StorageLike & { data: Map<string, string> };
  fetchDetails: ReturnType<typeof vi.fn>;
  fetchCastFn: ReturnType<typeof vi.fn>;
  resolveFn: ReturnType<typeof vi.fn>;
  wikiFn: ReturnType<typeof vi.fn>;
  deps: MigrationDeps;
}

function makeCtx(ids: string[], wiki?: Map<string, WikidataCastRow[]>): FakeCtx {
  const storage = memoryStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(v1Doc(ids)));
  const fetchDetails = vi.fn(async (id: string) => details(id));
  const fetchCastFn = vi.fn(async (id: string) => cast(id));
  const resolveFn = vi.fn(async (tmdbIds: string[]) =>
    Object.fromEntries(tmdbIds.map((id) => [id, `Q${id}`])),
  );
  const wikiFn = vi.fn(async () => wiki ?? new Map<string, WikidataCastRow[]>());

  return {
    storage,
    fetchDetails,
    fetchCastFn,
    resolveFn,
    wikiFn,
    deps: {
      storage,
      fetchSeriesDetails: fetchDetails,
      fetchSeriesCast: fetchCastFn,
      resolveSeriesQids: resolveFn,
      fetchWikidataCast: wikiFn,
      toTvImage: (p) => `https://img${p}`,
    },
  };
}

function readStored<T>(s: StorageLike & { data: Map<string, string> }): T {
  return JSON.parse(s.data.get(STORAGE_KEY)!);
}

describe("migrateIfNeeded", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("sem dados → não migra e devolve vazio", async () => {
    const storage = memoryStorage();
    const result = await migrateIfNeeded({
      storage,
      fetchSeriesDetails: vi.fn(),
      fetchSeriesCast: vi.fn(),
      resolveSeriesQids: vi.fn(),
      fetchWikidataCast: vi.fn(),
    });
    expect(result).toEqual({ migrated: false, doramas: [] });
  });

  it("já v2 → retorna doramas sem re-migrar (não chama fetch)", async () => {
    const storage = memoryStorage();
    const v2 = { schemaVersion: 2, doramas: [{ id: "1", title: "D1", addedAt: 1, cast: [] }], updatedAt: 1 };
    storage.setItem(STORAGE_KEY, JSON.stringify(v2));
    const fetchDetails = vi.fn(async () => details("1"));
    fetchDetails.mockRejectedValue(new Error("não deveria chamar"));
    const result = await migrateIfNeeded({
      storage,
      fetchSeriesDetails: fetchDetails,
      fetchSeriesCast: vi.fn(),
      resolveSeriesQids: vi.fn(),
      fetchWikidataCast: vi.fn(),
    });
    expect(result.migrated).toBe(false);
    expect(result.doramas).toEqual(v2.doramas);
    expect(result.error).toBeUndefined();
  });

  it("v1 → migra com título/ano/overview/poster/elenco e protagonista", async () => {
    const ctx = makeCtx(["1", "2"]);
    const result = await migrateIfNeeded(ctx.deps);

    expect(result.migrated).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.doramas).toHaveLength(2);

    const d1 = result.doramas[0];
    expect(d1.title).toBe("Titulo 1");
    expect(d1.year).toBe(2020);
    expect(d1.overview).toBe("Texto 1");
    expect(d1.posterUrl).toBe("https://img/p1.jpg");
    expect(d1.wikidataId).toBe("Q1");
    // billing: ordens 0,1 são protagonistas (topN=3)
    expect(d1.cast.filter((c) => c.protagonist)).toHaveLength(2);
    expect(d1.cast[0].personId).toBe("101");

    // persistiu v2 no storage
    const stored = readStored<{ schemaVersion: number; doramas: unknown[] }>(ctx.storage);
    expect(stored.schemaVersion).toBe(2);
    expect(stored.doramas).toHaveLength(2);
    expect(ctx.resolveFn).toHaveBeenCalledTimes(1);
  });

  it("v1 → mescla ator presente só no Wikidata (order null)", async () => {
    const wikiMem = new Map<string, WikidataCastRow[]>();
    wikiMem.set("Q1", [{ qid: "Q999", name: "Ator Novo", imageUrl: "https://wd/x.jpg" }]);
    const ctx = makeCtx(["1"], wikiMem);
    const result = await migrateIfNeeded(ctx.deps);

    const d1 = result.doramas[0];
    expect(d1.cast).toHaveLength(3); // 2 TMDB + 1 Wikidata
    const novo = d1.cast.find((c) => c.personId === "Q999");
    expect(novo).toBeDefined();
    expect(novo!.order).toBeNull();
    expect(novo!.protagonist).toBe(false);
  });

  it("v1 com falha em um dorama → parcial com migrationPending e preserva os migrados", async () => {
    const ctx = makeCtx(["1", "broken"]);
    ctx.fetchDetails.mockImplementation(async (id: string) => {
      if (id === "broken") throw new Error("rede fora");
      return details(id);
    });
    ctx.fetchCastFn.mockImplementation(async (id: string) => cast(id));

    const result = await migrateIfNeeded(ctx.deps);
    expect(result.migrated).toBe(true);
    expect(result.doramas).toHaveLength(1); // só o "1" migrou
    expect(result.error).toContain("broken");

    const stored = readStored<{ migrationPending?: boolean; lastError?: string }>(ctx.storage);
    expect(stored.migrationPending).toBe(true);
    expect(stored.lastError).toBeTruthy();
    // backup preservado
    expect(ctx.storage.data.has("dorama_graph_backup_v1")).toBe(true);
  });

  it("v1 sem doramas → migra para v2 vazio", async () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ nodes: [], links: [], updatedAt: 1 }));
    const result = await migrateIfNeeded({
      storage,
      fetchSeriesDetails: vi.fn(),
      fetchSeriesCast: vi.fn(),
      resolveSeriesQids: vi.fn(),
      fetchWikidataCast: vi.fn(),
    });
    expect(result.migrated).toBe(true);
    expect(result.doramas).toEqual([]);
    const stored = readStored<{ schemaVersion: number }>(storage);
    expect(stored.schemaVersion).toBe(2);
  });

  it("falha de lote antes de processar NÃO sobrescreve a chave v1", async () => {
    const ctx = makeCtx(["1", "2"]);
    ctx.resolveFn.mockRejectedValue(new Error("quota atingida"));
    const result = await migrateIfNeeded(ctx.deps);

    expect(result.migrated).toBe(false);
    expect(result.doramas).toEqual([]);
    expect(result.error).toContain("quota");
    // chave principal segue sendo v1 (não foi sobrescrita com v2 vazio)
    expect(readStored(ctx.storage)).toMatchObject({ nodes: expect.any(Array) });
  });
});
