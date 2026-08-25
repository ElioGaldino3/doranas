import { create } from "zustand";
import type { DoramaRecord, Screen } from "../types/models";

/**
 * Store do catálogo v2 (substitui o graphStore). Gerencia o estado em
 * memória: lista de doramas + navegação (telas trocáveis, sem router).
 *
 * A persistência em localStorage (chave dorama_graph_data, v2) e a migração
 * são responsabilidade da camada de persistência (Fase 3) — este store não
 * escreve no disco.
 */
interface CatalogState {
  doramas: DoramaRecord[];
  screen: Screen;

  setDoramas: (doramas: DoramaRecord[]) => void;
  addDorama: (dorama: DoramaRecord) => void;
  /** Troca a tela ativa; se não informada, mantém (uso interno de navegação). */
  navigate: (screen: Screen) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  doramas: [],
  screen: { name: "doramas" },

  setDoramas: (doramas) => set({ doramas }),
  addDorama: (dorama) =>
    set((state) => {
      if (state.doramas.some((d) => d.id === dorama.id)) return state;
      return { doramas: [...state.doramas, dorama] };
    }),

  navigate: (screen) => set({ screen }),
}));
