import { useCatalogStore } from "../store/catalogStore";
import { writeV2Doc } from "../services/persistence";
import { mergeDoramas } from "../utils/backup";
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

  const updateDorama = (dorama: DoramaRecord): void => {
    useCatalogStore.getState().updateDorama(dorama);
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

  /**
   * Importa doramas de um backup (já validado/parseado) mesclando-os ao
   * catálogo atual por TMDB id. Retorna false se a persistência falhar
   * (ex.: quota do localStorage).
   */
  const importDoramas = (records: DoramaRecord[]): boolean => {
    const current = useCatalogStore.getState().doramas;
    const merged = mergeDoramas(current, records);
    useCatalogStore.getState().setDoramas(merged);
    return writeV2Doc(merged);
  };

  return { addDorama, updateDorama, removeDorama, clearAll, importDoramas };
}