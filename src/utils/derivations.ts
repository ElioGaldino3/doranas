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

/**
 * Ids pelos quais um membro de elenco pode ser referenciado para
 * deduplicação: o `personId` (TMDB id ou QID) e, quando houver, o
 * `wikidataId`. O `wikidataId` vem primeiro porque é a identidade
 * globalmente única e autoritativa — cruza o TMDB id e o QID do mesmo ator
 * físico quando um dorama traz um e outro dorama traz o outro.
 */
export function actorIds(member: CastMember): string[] {
  return member.wikidataId ? [member.wikidataId, member.personId] : [member.personId];
}

/**
 * Mapa de qualquer id conhecido (TMDB id ou Wikidata QID) → id canônico do
 * ator, unificando entradas que compartilham um mesmo id (union-find sobre o
 * catálogo). Resolve o caso em que o mesmo ator aparece com `personId`
 * divergente entre doramas (ex.: TMDB id num dorama migrado e QID noutro
 * vindo só do Wikidata). O id canônico prefere o `wikidataId` quando este
 * participa da classe de equivalência.
 */
export function buildCanonicalIdMap(doramas: DoramaRecord[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const dorama of doramas) {
    for (const member of dorama.cast) {
      const ids = actorIds(member);
      let canon: string | undefined;
      for (const id of ids) {
        const existing = map.get(id);
        if (existing) {
          canon = existing;
          break;
        }
      }
      if (!canon) canon = ids[0];
      for (const id of ids) map.set(id, canon);
    }
  }
  return map;
}

/** Id canônico de um membro de elenco (usado para agrupar/dedup). */
export function canonicalId(member: CastMember, map: Map<string, string>): string {
  const ids = actorIds(member);
  for (const id of ids) {
    const canon = map.get(id);
    if (canon) return canon;
  }
  return ids[0];
}

export interface ActorAppearance {
  /** Id canônico do ator (TMDB id ou QID — unifica personIds divergentes). */
  personId: string;
  name: string;
  profileImgUrl?: string;
  wikidataId?: string;
  appearances: number;
  /** Ids dos doramas onde aparece. */
  doramaIds: string[];
}

/** Atores agregados por nº de aparições (desc), desempate por nome (asc).
 * Agrupa pelo id canônico do ator, unificando o mesmo ator físico quando ele
 * aparece com `personId` divergente (TMDB id vs Wikidata QID) entre doramas. */
export function actorsByAppearance(doramas: DoramaRecord[]): ActorAppearance[] {
  const map = buildCanonicalIdMap(doramas);
  const agg = new Map<string, ActorAppearance>();

  for (const dorama of doramas) {
    for (const member of dorama.cast) {
      const key = canonicalId(member, map);
      const existing = agg.get(key);
      if (existing) {
        existing.appearances += 1;
        existing.doramaIds.push(dorama.id);
        if (!existing.profileImgUrl && member.profileImgUrl) existing.profileImgUrl = member.profileImgUrl;
        if (!existing.wikidataId && member.wikidataId) existing.wikidataId = member.wikidataId;
        if (member.name) existing.name = member.name;
      } else {
        agg.set(key, {
          personId: key,
          name: member.name,
          profileImgUrl: member.profileImgUrl,
          wikidataId: member.wikidataId,
          appearances: 1,
          doramaIds: [dorama.id],
        });
      }
    }
  }

  return [...agg.values()].sort(
    (a, b) => b.appearances - a.appearances || a.name.localeCompare(b.name),
  );
}

/** Doramas (título + id) onde o ator aparece, exceto o dorama atual.
 * `personId` é o id canônico do ator (ver `buildCanonicalIdMap`). */
export function otherDoramasOf(
  doramas: DoramaRecord[],
  personId: string,
  currentDoramaId: string,
): { id: string; title: string; protagonist: boolean }[] {
  const map = buildCanonicalIdMap(doramas);
  const result: { id: string; title: string; protagonist: boolean }[] = [];
  for (const dorama of doramas) {
    if (dorama.id === currentDoramaId) continue;
    const member = dorama.cast.find((m) => canonicalId(m, map) === personId);
    if (member) result.push({ id: dorama.id, title: dorama.title, protagonist: member.protagonist });
  }
  return result;
}

/** Aparências de um ator em todos os doramas (para a página de detalhe do ator).
 * `personId` é o id canônico do ator (ver `buildCanonicalIdMap`). */
export function doramasOfPerson(
  doramas: DoramaRecord[],
  personId: string,
): { id: string; title: string; year?: number | null; protagonist: boolean }[] {
  const map = buildCanonicalIdMap(doramas);
  const result: { id: string; title: string; year?: number | null; protagonist: boolean }[] = [];
  for (const dorama of doramas) {
    const member = dorama.cast.find((m) => canonicalId(m, map) === personId);
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
