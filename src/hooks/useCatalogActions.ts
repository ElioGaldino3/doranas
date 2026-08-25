import { useCatalogStore } from "../store/catalogStore";
import { writeV2Doc } from "../services/persistence";
import { mergeDoramas, type ParsedBackup } from "../utils/backup";
import { buildCanonicalIdMap, canonicalId } from "../utils/derivations";
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

  /**
   * Remove um ator (id canônico) de TODOS os doramas do catálogo — limpa as
   * aparições indesejadas. Não-destrutivo em relação aos doramas: apenas
   * remove os CastMember que casam com o id canônico. Persiste e retorna true.
   */
  const removeActorFromCatalog = (personId: string): boolean => {
    const { doramas, actorAliases } = useCatalogStore.getState();
    const map = buildCanonicalIdMap(doramas, actorAliases);
    const next = doramas.map((d) => {
      const filtered = d.cast.filter(
        (m) => canonicalId(m, map, actorAliases) !== personId,
      );
      return filtered.length === d.cast.length ? d : { ...d, cast: filtered };
    });
    useCatalogStore.getState().setDoramas(next);
    persist();
    return true;
  };

  return { addDorama, updateDorama, removeDorama, clearAll, mergeActorAlias, importDoramas, removeActorFromCatalog };
}