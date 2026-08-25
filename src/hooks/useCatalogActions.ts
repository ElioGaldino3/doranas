import { useCatalogStore } from "../store/catalogStore";
import { writeV2Doc } from "../services/persistence";
import type { DoramaRecord } from "../types/models";

/**
 * Ponte store ↔ persistência (padrão do antigo useLocalStorageGraph).
 *
 * O catalogStore continua puro (sem escrita em disco — decisão da Fase 2);
 * as ações de mutação abaixo atualizam o store E persistem o doc v2 na chave
 * `dorama_graph_data`.
 */
function persist(): void {
  writeV2Doc(useCatalogStore.getState().doramas);
}

export function useCatalogActions() {
  const addDorama = (dorama: DoramaRecord): void => {
    useCatalogStore.getState().addDorama(dorama);
    persist();
  };

  const removeDorama = (doramaId: string): void => {
    useCatalogStore.getState().removeDorama(doramaId);
    persist();
  };

  const clearAll = (): void => {
    useCatalogStore.getState().clearAll();
    persist();
  };

  return { addDorama, removeDorama, clearAll };
}