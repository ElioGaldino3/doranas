import type { DoramaRecord } from "../types/models";
import type { TmdbToQidMap, WikidataCastRow } from "../types/wikidata";
import { enrichDoramaWithWikidata } from "../utils/derivations";

/**
 * Re-hidratação de doramas com elenco do Wikidata (para adds manuais, que são
 * TMDB-only). Núcleo puro com deps injetadas (padrão de `migration.ts`):
 *
 * - Só processa doramas com `wikidataId == null` (nunca resolvidos).
 * - Resolve QIDs no lote (1 query VALUES) e busca elenco no lote sequencial
 *   (pacing/retry do `fetchCastForQids`).
 * - Doramas sem QID no Wikidata (cobertura incompleta) permanecem como estão.
 * - **Não persiste nada** (a persistência fica no consumidor/hook); em falha de
 *   lote o erro se propaga sem mutar o estado.
 */

export interface RehydrateDeps {
  resolveSeriesQids: (tmdbIds: string[]) => Promise<TmdbToQidMap>;
  fetchWikidataCast: (qids: string[]) => Promise<Map<string, WikidataCastRow[]>>;
  onProgress?: (done: number, total: number) => void;
}

export interface RehydrateResult {
  /** Lista completa (ordem preservada), com os atualizados no lugar. */
  doramas: DoramaRecord[];
  /** Apenas os doramas que tiveram elenco/wikidataId atualizados. */
  updated: DoramaRecord[];
  updatedCount: number;
  /** Já resolvidos (wikidataId != null) — não re-processados. */
  skippedCount: number;
}

export async function rehydrateDoramas(
  doramas: DoramaRecord[],
  deps: RehydrateDeps,
): Promise<RehydrateResult> {
  const pending = doramas.filter((d) => d.wikidataId == null);
  const skippedCount = doramas.length - pending.length;

  if (pending.length === 0) {
    return { doramas, updated: [], updatedCount: 0, skippedCount };
  }

  const ids = pending.map((d) => d.id);
  const qidMap = await deps.resolveSeriesQids(ids);
  const resolvedQids = ids
    .map((id) => qidMap[id])
    .filter((q): q is string => Boolean(q));
  const wikiCast =
    resolvedQids.length > 0
      ? await deps.fetchWikidataCast(resolvedQids)
      : new Map<string, WikidataCastRow[]>();

  const updated: DoramaRecord[] = [];
  const updatedById = new Map<string, DoramaRecord>();

  pending.forEach((d, index) => {
    deps.onProgress?.(index, pending.length);
    const qid = qidMap[d.id];
    if (!qid) return; // sem QID no Wikidata — mantém como está
    const enriched = enrichDoramaWithWikidata(d, qid, wikiCast.get(qid) ?? []);
    updatedById.set(d.id, enriched);
    updated.push(enriched);
  });

  return {
    doramas: doramas.map((d) => updatedById.get(d.id) ?? d),
    updated,
    updatedCount: updated.length,
    skippedCount,
  };
}