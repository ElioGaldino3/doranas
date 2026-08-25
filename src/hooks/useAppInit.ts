import { useEffect, useState } from "react";
import { useCatalogStore } from "../store/catalogStore";
import { migrateIfNeeded } from "../services/migration";
import { imageUrl, getSeriesDetails, getSeriesCast } from "../services/tmdb";
import { resolveSeriesQidsByTmdbIds, fetchCastForQids } from "../services/wikidata";
import type { CastResult } from "../types/tmdb";

export interface AppInitState {
  /** true enquanto a migração/leitura inicial está em andamento. */
  loading: boolean;
  /** progresso da migração: [feitos, total]; null fora de migração. */
  progress: { done: number; total: number } | null;
  /** erro (parcial) da migração, se houver. */
  error?: string;
  /** true se a migração v1→v2 foi executada nesta sessão. */
  migrated: boolean;
}

/**
 * Roda no mount: checa a versão do banco local e, se for v1, executa a
 * migração automática (TMDB details+cast + Wikidata cast), com progresso e
 * salvamento parcial em caso de falha. Ao final, povoa o catalogStore.
 */
export function useAppInit(): AppInitState {
  const setDoramas = useCatalogStore((s) => s.setDoramas);
  const [state, setState] = useState<AppInitState>({
    loading: true,
    progress: null,
    migrated: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const result = await migrateIfNeeded({
          storage: localStorage,
          fetchSeriesDetails: async (id) => getSeriesDetails(id),
          fetchSeriesCast: async (id): Promise<CastResult[]> => {
            const data = await getSeriesCast(Number(id));
            return Array.isArray(data.cast) ? data.cast : [];
          },
          resolveSeriesQids: (ids) => resolveSeriesQidsByTmdbIds(ids),
          fetchWikidataCast: (qids) => fetchCastForQids(qids),
          toTvImage: imageUrl,
          onProgress: (done, total) => {
            if (!cancelled) setState((s) => ({ ...s, progress: { done, total } }));
          },
        });

        if (!cancelled) {
          setDoramas(result.doramas);
          setState({
            loading: false,
            progress: null,
            error: result.error,
            migrated: result.migrated,
          });
        }
      } catch (e) {
        console.error("Falha na inicialização do banco", e);
        if (!cancelled) {
          setState({
            loading: false,
            progress: null,
            error: e instanceof Error ? e.message : "Erro ao carregar dados",
            migrated: false,
          });
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [setDoramas]);

  return state;
}
