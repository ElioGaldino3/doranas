import { useCallback, useState } from "react";
import { useCatalogStore } from "../store/catalogStore";
import { useCatalogActions } from "./useCatalogActions";
import { rehydrateDoramas } from "../services/rehydrate";
import { resolveSeriesQidsByTmdbIds, fetchCastForQids } from "../services/wikidata";

/**
 * Re-hidratação de doramas com elenco do Wikidata (adds manuais são TMDB-only).
 * - `rehydrateOne(id)`: enriquece um dorama específico.
 * - `rehydrateAll()`: enriquece todos os pendentes (`wikidataId == null`).
 * Atualiza o store e persiste a cada dorama (recuperação parcial em falha).
 */
export function useRehydrate() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { updateDorama } = useCatalogActions();

  const run = useCallback(
    async (ids: string[]): Promise<number> => {
      setBusy(true);
      setError(null);
      setProgress(null);
      try {
        const current = useCatalogStore.getState().doramas;
        const targets = ids.length === 0 ? current : current.filter((d) => ids.includes(d.id));
        if (targets.length === 0) return 0;

        const result = await rehydrateDoramas(targets, {
          resolveSeriesQids: (tmdbIds) => resolveSeriesQidsByTmdbIds(tmdbIds),
          fetchWikidataCast: (qids) => fetchCastForQids(qids),
          onProgress: (done, total) => setProgress({ done, total }),
        });

        for (const dorama of result.updated) {
          updateDorama(dorama);
        }
        return result.updated.length;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha na sincronização com o Wikidata");
        return 0;
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [updateDorama],
  );

  const rehydrateOne = useCallback((doramaId: string) => run([doramaId]), [run]);
  const rehydrateAll = useCallback(() => run([]), [run]);

  return { rehydrateOne, rehydrateAll, busy, progress, error };
}