import { PROTAGONIST_TOP_N } from "../types/models";
import type { CastMember, DoramaRecord } from "../types/models";
import type { WikidataCastRow } from "../types/wikidata";
import type { CastResult, SeriesDetails } from "../types/tmdb";

/** Define `protagonist` para um elenco baseado no billing order do TMDB.
 * Billing é 0-based (0 = primeiro); os `topN` primeiros são considerados
 * protagonistas (orders 0..topN-1). */
export function applyProtagonistHeuristic(
  cast: CastMember[],
  topN: number = PROTAGONIST_TOP_N,
): CastMember[] {
  return cast.map((member) => ({
    ...member,
    protagonist: member.order !== null && member.order < topN,
  }));
}

/**
 * Converte o elenco do TMDB (CastResult[]) em CastMember[] preservando a
 * ordem de billing (o índice na lista do TMDB é o billing).
 * `toProfileUrl` recebe o profile_path relativo e devolve a URL completa
 * (ex.: imageUrl() do services/tmdb); se ausente, mantém profileImgUrl vazio.
 */
export function tmdbCastToMembers(
  cast: CastResult[],
  toProfileUrl?: (path: string) => string,
): CastMember[] {
  return cast.map((c, index) => ({
    personId: String(c.id),
    name: c.name,
    profileImgUrl: c.profile_path ? toProfileUrl?.(c.profile_path) : undefined,
    order: index,
    protagonist: false,
  }));
}

/**
 * Merge do elenco TMDB ⊕ Wikidata.
 * - O TMDB é a base (preserva billing/order).
 * - Atores vindos só do Wikidata (sem TMDB person id) são adicionados no fim,
 *   com personId = QID, order = null.
 * - Cruza por TMDB person id (P4985) ou por QID para não duplicar.
 */
export function mergeCast(
  tmdbMembers: CastMember[],
  wikidataRows: WikidataCastRow[],
): CastMember[] {
  // Clona os membros TMDB para não mutar a entrada (pureza).
  const merged: CastMember[] = tmdbMembers.map((m) => ({ ...m }));
  const seen = new Set<string>(
    merged.flatMap((m) => [m.personId, ...(m.wikidataId ? [m.wikidataId] : [])]),
  );

  // Enriquecer membros TMDB com wikidataId, se houver casamento por TMDB person id.
  for (const row of wikidataRows) {
    if (row.qid) {
      const existing = merged.find((m) => m.personId === row.tmdbPersonId);
      if (existing) existing.wikidataId = row.qid;
    }
  }

  for (const row of wikidataRows) {
    const matches = row.tmdbPersonId
      ? merged.some((m) => m.personId === row.tmdbPersonId)
      : false;
    const key = row.qid || (row.tmdbPersonId ?? "");
    if (matches || seen.has(key)) continue;

    merged.push({
      personId: row.qid,
      name: row.name,
      profileImgUrl: row.imageUrl,
      order: null,
      protagonist: false,
      wikidataId: row.qid,
    });
  }

  return merged;
}

export interface ActorAppearance {
  personId: string;
  name: string;
  profileImgUrl?: string;
  wikidataId?: string;
  appearances: number;
  /** Ids dos doramas onde aparece. */
  doramaIds: string[];
}

/** Atores agregados por nº de aparições (desc), desempate por nome (asc). */
export function actorsByAppearance(doramas: DoramaRecord[]): ActorAppearance[] {
  const map = new Map<string, ActorAppearance>();

  for (const dorama of doramas) {
    for (const member of dorama.cast) {
      const existing = map.get(member.personId);
      if (existing) {
        existing.appearances += 1;
        existing.doramaIds.push(dorama.id);
        if (!existing.profileImgUrl && member.profileImgUrl) existing.profileImgUrl = member.profileImgUrl;
        if (!existing.wikidataId && member.wikidataId) existing.wikidataId = member.wikidataId;
        if (member.name) existing.name = member.name;
      } else {
        map.set(member.personId, {
          personId: member.personId,
          name: member.name,
          profileImgUrl: member.profileImgUrl,
          wikidataId: member.wikidataId,
          appearances: 1,
          doramaIds: [dorama.id],
        });
      }
    }
  }

  return [...map.values()].sort(
    (a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name),
  );
}

/** Doramas (título + id) onde o ator aparece, exceto o dorama atual. */
export function otherDoramasOf(
  doramas: DoramaRecord[],
  personId: string,
  currentDoramaId: string,
): { id: string; title: string; protagonist: boolean }[] {
  const result: { id: string; title: string; protagonist: boolean }[] = [];
  for (const dorama of doramas) {
    if (dorama.id === currentDoramaId) continue;
    const member = dorama.cast.find((m) => m.personId === personId);
    if (member) result.push({ id: dorama.id, title: dorama.title, protagonist: member.protagonist });
  }
  return result;
}

/** Aparências de um ator em todos os doramas (para a página de detalhe do ator). */
export function doramasOfPerson(
  doramas: DoramaRecord[],
  personId: string,
): { id: string; title: string; year?: number | null; protagonist: boolean }[] {
  const result: { id: string; title: string; year?: number | null; protagonist: boolean }[] = [];
  for (const dorama of doramas) {
    const member = dorama.cast.find((m) => m.personId === personId);
    if (member) {
      result.push({
        id: dorama.id,
        title: dorama.title,
        year: dorama.year,
        protagonist: member.protagonist,
      });
    }
  }
  return result;
}

/** Extrai o ano de uma data "YYYY-MM-DD" do TMDB (ou null). */
function yearFromFirstAirDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const y = Number.parseInt(dateStr.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

/**
 * Monta um DoramaRecord a partir dos detalhes + elenco do TMDB. Usado no
 * fluxo de adição manual (busca): TMDB-only, sem resolução de Wikidata —
 * `wikidataId` fica null até uma re-hidratação futura.
 * `toImageUrl` resolve paths relativos (poster e perfil do elenco) para URL.
 */
export function doramaFromTmdb(
  details: SeriesDetails,
  cast: CastResult[],
  toImageUrl?: (path: string) => string,
): DoramaRecord {
  return {
    id: String(details.id),
    title: details.name,
    year: yearFromFirstAirDate(details.first_air_date),
    overview: details.overview || undefined,
    posterUrl: details.poster_path ? toImageUrl?.(details.poster_path) : undefined,
    addedAt: Date.now(),
    wikidataId: null,
    cast: applyProtagonistHeuristic(tmdbCastToMembers(cast, toImageUrl)),
  };
}

/**
 * Enriquece um dorama com o elenco do Wikidata (re-hidratação de adds manuais,
 * que são TMDB-only). Idempotente: `mergeCast` deduplica por personId/QID, logo
 * re-executar sobre um dorama já enriquecido não duplica atores.
 */
export function enrichDoramaWithWikidata(
  dorama: DoramaRecord,
  qid: string,
  wikiRows: WikidataCastRow[],
): DoramaRecord {
  return {
    ...dorama,
    wikidataId: qid,
    cast: applyProtagonistHeuristic(mergeCast(dorama.cast, wikiRows)),
  };
}
