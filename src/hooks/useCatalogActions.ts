import { useCatalogStore } from "../store/catalogStore";
import { writeV2Doc } from "../services/persistence";
import { mergeDoramas, type ParsedBackup } from "../utils/backup";
import type { DoramaRecord } from "../types/models";

/**
 * Ponte store ↔ persistência (padrão do antigo useLocalStorageGraph).
 *
 * O catalogStore continua puro (sem escrita em disco — decisão da Fase 2);
 * as ações de mutação abaixo atualizam o store E persistem o doc v2 na chave
 * `dorama_graph_data` (incluindo os `actorAliases` de merge manual).
 */
function persist(): void {
  const { doramas, actorAliases } = useCatalogStore.getState();
  writeV2Doc(doramas, { actorAliases });
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
   * Mescla um ator duplicado (`sourceId`) no ator canônico (`targetId`) via
   * alias manual, não-destrutivo. Não altera os CastMember persistidos — só
   * adiciona o alias consultado em tempo de leitura. Retorna false se a
   * persistência falhar.
   */
  const mergeActorAlias = (sourceId: string, targetId: string): boolean => {
    if (sourceId === targetId) return true;
    useCatalogStore.getState().addActorAlias(sourceId, targetId);
    persist();
    return true;
  };

  /**
   * Importa doramas de um backup (já validado/parseado) mesclando-os ao
   * catálogo atual por TMDB id, e funde os `actorAliases` do backup com os
   * existentes (importado prevalece). Retorna false se a persistência falhar
   * (ex.: quota do localStorage).
   */
  const importDoramas = (parsed: ParsedBackup): boolean => {
    const { doramas: current, actorAliases: currentAliases } =
      useCatalogStore.getState();
    const merged = mergeDoramas(current, parsed.doramas);
    const aliases = { ...currentAliases, ...(parsed.actorAliases ?? {}) };
    useCatalogStore.getState().setDoramas(merged);
    useCatalogStore.getState().setActorAliases(aliases);
    return writeV2Doc(merged, { actorAliases: aliases });
  };

  return { addDorama, updateDorama, removeDorama, clearAll, mergeActorAlias, importDoramas };
}