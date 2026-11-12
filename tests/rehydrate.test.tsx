import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DoramaDetailScreen } from "../src/components/catalog/DoramaDetailScreen";
import { DoramasScreen } from "../src/components/catalog/DoramasScreen";
import { useCatalogStore } from "../src/store/catalogStore";
import {
  resolveSeriesQidsByTmdbIds,
  fetchCastForQids,
} from "../src/services/wikidata";
import type { WikidataCastRow } from "../src/types/wikidata";
import { STORAGE_KEY } from "../src/services/persistence";

// Mocka só o serviço de rede; `rehydrateDoramas` (real) desce até esses dois.
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
  cast: [{ personId: "p1", name: "Ator Base", order: 0, protagonist: true }],
});

beforeEach(() => {
  useCatalogStore.setState({ doramas: [], screen: { name: "doramas" } });
  vi.clearAllMocks();
  mockResolve.mockResolvedValue({ "42": "Q42" });
  mockCast.mockImplementation(async (qids: string[]) => {
    const map = new Map<string, WikidataCastRow[]>();
    for (const q of qids) {
      map.set(q, [
        { qid: "Q7", name: "Casa TMDB", tmdbPersonId: "p1" },
        { qid: "Q999", name: "Só Wiki", tmdbPersonId: undefined },
      ]);
    }
    return map;
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("re-hidratação (UI)", () => {
  it("busca convidados e créditos agregados novamente em um dorama já enriquecido", async () => {
    const user = userEvent.setup();
    useCatalogStore.setState({ doramas: [dorama("42", "Q42")], actorAliases: { "1": "p1" } });
    const actor = (id: number, name: string) => ({ id, name, profile_path: null, character: "" });
    const guest = actor(3, "Ator convidado");
    const fetchCast = vi.fn(async (url: string) => {
      const path = new URL(url).pathname;
      const responses: Record<string, unknown> = {
        "/3/tv/42/credits": { cast: [actor(1, "Ator Base")] },
        "/3/tv/42/aggregate_credits": { cast: [actor(1, "Ator Base"), actor(2, "Ator recorrente")] },
        "/3/tv/42": { seasons: [{ season_number: 1 }, { season_number: 2 }] },
        "/3/tv/42/season/1": { episodes: [{ guest_stars: [guest] }, { guest_stars: [guest] }] },
      };
      return { ok: path in responses, json: async () => responses[path] };
    });
    vi.stubGlobal("fetch", fetchCast);
    render(<DoramaDetailScreen doramaId="42" />);

    const button = screen.getByRole("button", { name: "Buscar mais atores" });
    await user.click(button);
    expect(await screen.findByText(/2 atores adicionados.*Parte da consulta/)).toBeInTheDocument();
    expect(screen.getByText("Ator recorrente")).toBeInTheDocument();
    expect(screen.getByText("Ator convidado")).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.doramas[0].cast.map((member: { personId: string; protagonist: boolean }) =>
      [member.personId, member.protagonist],
    )).toEqual([["p1", true], ["2", false], ["3", false]]);

    await user.click(button);
    expect(await screen.findByText(/Nenhum ator novo encontrado/)).toBeInTheDocument();
    expect(fetchCast).toHaveBeenCalledTimes(10);
  });

  it("detalhe: enriquece o dorama via botão e some ao concluir", async () => {
    const user = userEvent.setup();
    useCatalogStore.setState({ doramas: [dorama("42")] });

    render(<DoramaDetailScreen doramaId="42" />);

    const btn = screen.getByRole("button", { name: /Enriquecer elenco/ });
    await user.click(btn);

    expect(await screen.findByText(/enriquecido com o Wikidata/)).toBeInTheDocument();
    expect(await screen.findByText("Só Wiki")).toBeInTheDocument();

    const state = useCatalogStore.getState();
    const updated = state.doramas.find((d) => d.id === "42");
    expect(updated?.wikidataId).toBe("Q42");
    // p1 enriquecido com QID + ator só-Wikidata (casamentos não duplicam)
    expect(updated?.cast).toHaveLength(2);
    expect(updated?.cast.find((c) => c.personId === "p1")?.wikidataId).toBe("Q7");

    // com wikidataId resolvido, o botão some
    expect(screen.queryByRole("button", { name: /Enriquecer elenco/ })).not.toBeInTheDocument();
  });

  it("lista: sincronização em lote processa pendentes e mostra badge", async () => {
    const user = userEvent.setup();
    useCatalogStore.setState({
      doramas: [dorama("42"), dorama("7", "Q7")],
    });

    render(<DoramasScreen />);

    const btn = screen.getByRole("button", { name: /Sincronizar Wikidata/ });
    expect(btn).toHaveTextContent("1"); // badge de pendentes
    await user.click(btn);

    expect(
      await screen.findByText("1 dorama enriquecido com o Wikidata."),
    ).toBeInTheDocument();

    const state = useCatalogStore.getState();
    expect(state.doramas.find((d) => d.id === "42")?.wikidataId).toBe("Q42");
    expect(state.doramas.find((d) => d.id === "7")?.wikidataId).toBe("Q7");

    // sem pendentes, botão desabilita e badge some
    const after = screen.getByRole("button", { name: /Sincronizar Wikidata/ });
    expect(after).toBeDisabled();
    expect(after).not.toHaveTextContent("1");
  });
});
