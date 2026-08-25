import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "../src/components/search/SearchInput";
import { useCatalogStore } from "../src/store/catalogStore";
import {
  searchSeries,
  getSeriesCast,
  getSeriesDetails,
} from "../src/services/tmdb";
import type { DoramaRecord } from "../src/types/models";

// Serve de mock do módulo de serviços TMDB: a busca/adição passa pelo hook
// real useTMDB, que desce até essas funções (sem rede).
vi.mock("../src/services/tmdb", () => ({
  searchSeries: vi.fn(),
  findByImdbId: vi.fn(),
  getSeriesCast: vi.fn(),
  getSeriesDetails: vi.fn(),
  imageUrl: (path: string) => `https://img${path}`,
}));

const mockSearch = vi.mocked(searchSeries);
const mockCast = vi.mocked(getSeriesCast);
const mockDetails = vi.mocked(getSeriesDetails);

const result = {
  id: 42,
  name: "Crash Landing on You",
  poster_path: "/p42.jpg",
  first_air_date: "2019-12-14",
};

const alreadyInCatalog: DoramaRecord = {
  id: "42",
  title: "Crash Landing on You",
  year: 2019,
  addedAt: Date.now(),
  cast: [],
};

beforeEach(() => {
  useCatalogStore.setState({ doramas: [], screen: { name: "doramas" } });
  vi.clearAllMocks();
  mockSearch.mockResolvedValue({ results: [result] } as never);
  mockCast.mockResolvedValue({ cast: [{ id: 1, name: "Ator A", profile_path: null, character: "..." }] } as never);
  mockDetails.mockResolvedValue({
    id: 42,
    name: "Crash Landing on You",
    first_air_date: "2019-12-14",
    overview: "Sinopse",
    poster_path: "/p42.jpg",
  } as never);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

async function searchAndSelect() {
  const user = userEvent.setup();
  render(<SearchInput />);
  const input = screen.getByPlaceholderText(/Buscar dorama/);
  await user.type(input, "crash landing");
  await user.click(screen.getByRole("button", { name: "Buscar" }));
  const option = await screen.findByText("Crash Landing on You");
  await user.click(option);
}

describe("SearchInput", () => {
  it("adiciona um dorama ao catálogo via busca", async () => {
    await searchAndSelect();

    expect(
      await screen.findByText(/"Crash Landing on You" adicionado ao catálogo\./),
    ).toBeInTheDocument();
    const state = useCatalogStore.getState();
    expect(state.doramas).toHaveLength(1);
    expect(state.doramas[0].id).toBe("42");
    expect(state.doramas[0].cast).toHaveLength(1);
    expect(mockDetails).toHaveBeenCalledWith(42);
    expect(mockCast).toHaveBeenCalledWith(42);
  });

  it("bloqueia duplicado já presente no catálogo", async () => {
    useCatalogStore.setState({ doramas: [alreadyInCatalog] });
    await searchAndSelect();

    expect(
      await screen.findByText(/"Crash Landing on You" já está no catálogo\./),
    ).toBeInTheDocument();
    expect(useCatalogStore.getState().doramas).toHaveLength(1);
    expect(mockDetails).not.toHaveBeenCalled();
  });

  it("mostra error da busca quando a API falha", async () => {
    mockSearch.mockRejectedValue(new Error("falhou"));
    const user = userEvent.setup();
    render(<SearchInput />);
    const input = screen.getByPlaceholderText(/Buscar dorama/);
    await user.type(input, "x");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(await screen.findByText("falhou")).toBeInTheDocument();
  });
});