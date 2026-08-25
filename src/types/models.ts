/**
 * Modelo de dados v2 do catálogo (substitui o modelo de grafo).
 *
 * O catálogo é uma lista de doramas assistidos, cada um com seu elenco.
 * Ator é derivado do elenco (não existe armazenamento separado).
 */

export const SCHEMA_VERSION = 2;

/** Membros do elenco de um dorama (TMDB ⊕ Wikidata, mesclados/deduplicados). */
export interface CastMember {
  /** TMDB person id OU Wikidata QID (para atores vindos só do Wikidata). */
  personId: string;
  name: string;
  profileImgUrl?: string;
  /** Billing order do TMDB (menor = mais protagonista). null p/ atores só-Wikidata. */
  order: number | null;
  /** Definido pela heurística de billing (order <= PROTAGONIST_TOP_N). */
  protagonist: boolean;
  /** Wikidata QID, se conhecido (usado p/ cruzar com TMDB e deduplicar). */
  wikidataId?: string;
}

export interface DoramaRecord {
  /** TMDB TV series id (fonte de verdade da identidade). */
  id: string;
  title: string;
  year?: number | null;
  overview?: string;
  posterUrl?: string;
  /** Timestamp de quando o dorama entrou no catálogo (ms). */
  addedAt: number;
  /** Wikidata QID da série, se resolvido (null = ainda não resolvido). */
  wikidataId?: string | null;
  cast: CastMember[];
}

/** Documento persistido no localStorage (chave dorama_graph_data, v2). */
export interface DoramaDocument {
  schemaVersion: number;
  doramas: DoramaRecord[];
  /**
   * Merge manual de atores (não-destrutivo): mapa `idDuplicado → idCanonico`.
   * Resolve a limitação do dedup automático (Fase 5), quando um ator só-TMDB
   * e um ator só-Wikidata do mesmo indivíduo ficam separados. Consultado em
   * tempo de leitura por `buildCanonicalIdMap`. Opcional (ausente = sem merge).
   */
  actorAliases?: Record<string, string>;
  /** Marca migração incompleta (ex.: rede caiu) p/ permitir retomar. */
  migrationPending?: boolean;
  lastError?: string;
  updatedAt: number;
}

/** Limiar de billing (0-based) para considerar um ator protagonista:
 * atores com `order < PROTAGONIST_TOP_N` (os N primeiros do billing). */
export const PROTAGONIST_TOP_N = 3;

/** Navegação do app (telas trocáveis, sem router). */
export type Screen =
  | { name: "doramas" }
  | { name: "atores" }
  | { name: "dorama-detail"; doramaId: string }
  | { name: "ator-detail"; personId: string };
