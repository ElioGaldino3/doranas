import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import App from "../src/App";
import { useAppInit } from "../src/hooks/useAppInit";
import { useCatalogStore } from "../src/store/catalogStore";
import type { DoramaRecord } from "../src/types/models";

// A inicialização (migração v1→v2 + TMDB/Wikidata reais) fica mockada nos
// testes de UI; o catalogStore é o store real, semeado por teste.
vi.mock("../src/hooks/useAppInit", () => ({
  useAppInit: vi.fn(),
}));

// A re-hidratação em background é enfileirada automaticamente; nos testes de
// App ela é desativada para não disparar rede real.
vi.mock("../src/hooks/useAutoRehydrate", () => ({
  useAutoRehydrate: vi.fn(),
}));

const mockUseAppInit = vi.mocked(useAppInit);

const dorama = (id: string, title?: string): DoramaRecord => ({
  id,
  title: title ?? `Dorama ${id}`,
  year: 2020,
  addedAt: Date.now(),
  cast: [{ personId: "a1", name: "Ator 1", order: 0, protagonist: true }],
});

const idleInit = {
  loading: false,
  progress: null,
  migrated: false,
  error: undefined,
};

beforeEach(() => {
  useCatalogStore.setState({ doramas: [], screen: { name: "doramas" } });
  mockUseAppInit.mockReturnValue(idleInit);
});

afterEach(() => {
  cleanup();
});

describe("App", () => {
  it("mostra a tela de carregamento enquanto inicializa", () => {
    mockUseAppInit.mockReturnValue({ ...idleInit, loading: true });
    render(<App />);
    expect(screen.getByText("Carregando catálogo…")).toBeInTheDocument();
  });

  it("mostra o empty state quando o catálogo está vazio", () => {
    render(<App />);
    expect(screen.getByText("Seu catálogo está vazio")).toBeInTheDocument();
  });

  it("lista os doramas do catálogo em cards", () => {
    useCatalogStore.setState({
      doramas: [dorama("1", "Crash Landing on You"), dorama("2", "Goblin")],
    });
    render(<App />);
    expect(screen.getByText("Crash Landing on You")).toBeInTheDocument();
    expect(screen.getByText("Goblin")).toBeInTheDocument();
    expect(screen.getByText("2 doramas no catálogo")).toBeInTheDocument();
  });

  it("navega para o detalhe do dorama ao clicar no card", async () => {
    useCatalogStore.setState({ doramas: [dorama("1", "Goblin")] });
    render(<App />);
    fireEvent.click(screen.getByText("Goblin"));
    expect(await screen.findByText("Elenco · 1 ator")).toBeInTheDocument();
    expect(screen.getByText("Remover Dorama")).toBeInTheDocument();
  });

  it("troca para a aba Atores e lista os atores por aparição", () => {
    useCatalogStore.setState({ doramas: [dorama("1", "Goblin")] });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Atores" }));
    expect(screen.getByText("Ator 1")).toBeInTheDocument();
    expect(screen.getByText("1 aparição")).toBeInTheDocument();
  });

  it("exibe banner de erro parcial da migração", () => {
    mockUseAppInit.mockReturnValue({
      ...idleInit,
      error: "Falha ao rehidratar 1 dorama(s): 9",
    });
    render(<App />);
    expect(
      screen.getByText("Falha ao rehidratar 1 dorama(s): 9"),
    ).toBeInTheDocument();
  });
});