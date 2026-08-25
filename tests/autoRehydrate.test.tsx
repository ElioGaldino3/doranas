import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { useAutoRehydrate } from "../src/hooks/useAutoRehydrate";
import { useCatalogStore } from "../src/store/catalogStore";
import {
  resolveSeriesQidsByTmdbIds,
  fetchCastForQids,
} from "../src/services/wikidata";
import type { WikidataCastRow } from "../src/types/wikidata";

vi.mock("../src/services/wikidata", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../src/services/wikidata")>();
  return {
    ...mod,
    resolveSeriesQidsByTmdbIds: vi.fn(),
    fetchCastForQids: vi.fn(),
  };
});

const mockResolve = vi.mocked(resolveSeriesQidsByTmdbIds);
const mockCast = vi.mocked(fetchCastForQids);

const dorama = (id: string, wikidataId?: string | null) => ({
  id,
  title: `Dorama ${id}`,
  year: 2020,
  addedAt: Date.now(),
  wikidataId: wikidataId ?? null,
  cast: [{ personId: "p1", name: "Ator", order: 0, protagonist: true }],
});

beforeEach(() => {
  useCatalogStore.setState({ doramas: [], screen: { name: "doramas" } });
  vi.clearAllMocks();
  mockResolve.mockResolvedValue({ "42": "Q42" });
  mockCast.mockImplementation(async (qids: string[]) => {
    const map = new Map<string, WikidataCastRow[]>();
    for (const q of qids) {
      map.set(q, [{ qid: "Q7", name: "Casa TMDB", tmdbPersonId: "p1" }]);
    }
    return map;
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Componente mínimo que dispara o hook sob teste.
function Harness() {
  useAutoRehydrate();
  return null;
}

describe("useAutoRehydrate", () => {
  it("re-hidrata pendentes automaticamente ao carregar o catálogo", async () => {
    useCatalogStore.setState({ doramas: [dorama("42")] });

    render(<Harness />);

    // Aguarda o efeito rodar e atualizar o store.
    await new Promise((r) => setTimeout(r, 50));

    const updated = useCatalogStore.getState().doramas.find((d) => d.id === "42");
    expect(updated?.wikidataId).toBe("Q42");
    expect(mockResolve).toHaveBeenCalledWith(["42"]);
  });

  it("não dispara quando não há pendentes", async () => {
    useCatalogStore.setState({ doramas: [dorama("7", "Q7")] });

    render(<Harness />);
    await new Promise((r) => setTimeout(r, 50));

    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("dispara apenas uma vez por montagem", async () => {
    useCatalogStore.setState({ doramas: [dorama("42")] });

    render(<Harness />);
    await new Promise((r) => setTimeout(r, 20));
    cleanup();
    render(<Harness />); // remonta — não deve disparar de novo
    await new Promise((r) => setTimeout(r, 50));

    expect(mockResolve).toHaveBeenCalledTimes(1);
  });
});
