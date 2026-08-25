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
  /** Merge manual de atores (não-destrutivo): idDuplicado → idCanonico. */
  actorAliases: Record<string, string>;

  setDoramas: (doramas: DoramaRecord[]) => void;
  addDorama: (dorama: DoramaRecord) => void;
  updateDorama: (dorama: DoramaRecord) => void;
  removeDorama: (doramaId: string) => void;
  clearAll: () => void;
  setActorAliases: (aliases: Record<string, string>) => void;
  /** Adiciona/atualiza um alias manual de merge de ator (não muta entradas). */
  addActorAlias: (sourceId: string, targetId: string) => void;
  /** Troca a tela ativa; se não informada, mantém (uso interno de navegação). */
  navigate: (screen: Screen) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  doramas: [],
  screen: { name: "doramas" },
  actorAliases: {},

  setDoramas: (doramas) => set({ doramas }),
  addDorama: (dorama) =>
    set((state) => {
      if (state.doramas.some((d) => d.id === dorama.id)) return state;
      return { doramas: [...state.doramas, dorama] };
    }),
  updateDorama: (dorama) =>
    set((state) => ({
      doramas: state.doramas.map((d) => (d.id === dorama.id ? dorama : d)),
    })),
  removeDorama: (doramaId) =>
    set((state) => ({
      doramas: state.doramas.filter((d) => d.id !== doramaId),
    })),
  clearAll: () => set({ doramas: [], actorAliases: {} }),
  setActorAliases: (aliases) => set({ actorAliases: aliases }),
  addActorAlias: (sourceId, targetId) =>
    set((state) => {
      if (sourceId === targetId) return state;
      // Remove alias prévio do source (se houver) e aplica o novo.
      const next = { ...state.actorAliases };
      delete next[sourceId];
      next[sourceId] = targetId;
      return { actorAliases: next };
    }),

  navigate: (screen) => set({ screen }),
}));
