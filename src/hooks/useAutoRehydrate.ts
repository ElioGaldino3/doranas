import { useEffect, useRef } from "react";
import { useCatalogStore } from "../store/catalogStore";
import { useRehydrate } from "./useRehydrate";

/**
 * Enfileira em background a re-hidratação dos doramas pendentes (wikidataId
 * null) assim que o catálogo é carregado — sem bloquear a UI. O badge de
 * pendentes e o progresso refletem o andamento em tempo real.
 *
 * Dispara uma única vez por montagem: quando o catálogo termina de carregar
 * com pendentes (ou estes aparecem depois). Roda em background via
 * `rehydrateAll` (rede Wikidata, sem chave TMDB).
 */
export function useAutoRehydrate(): void {
  const { rehydrateAll } = useRehydrate();
  const pendingCount = useCatalogStore(
    (s) => s.doramas.filter((d) => d.wikidataId == null).length,
  );
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (pendingCount === 0) return; // aguarda o catálogo carregar com pendentes
    ran.current = true;
    void rehydrateAll();
  }, [pendingCount, rehydrateAll]);
}
