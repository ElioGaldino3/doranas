import type { DoramaRecord } from "../types/models";
import type { CastResult, SeriesDetails } from "../types/tmdb";
import type { WikidataCastRow } from "../types/wikidata";
import type { TmdbToQidMap } from "../types/wikidata";
import {
  applyProtagonistHeuristic,
  mergeCast,
  tmdbCastToMembers,
} from "../utils/derivations";
import {
  isV1Doc,
  isV2Doc,
  readRawDoc,
  backupV1,
  doramasFromV1,
  writeV2Doc,
} from "./persistence";
import type { StorageLike } from "./persistence";

/**
 * Migração v1 → v2 do banco local (localStorage).
 *
 * Ao entrar no site, a UI chama `migrateIfNeeded`. Este módulo é o núcleo
 * puro: recebe dependências injetadas (storage + resolvedores TMDB/Wikidata)
 * para ser testável sem rede.
 *
 * Comportamento:
 * - Sem dados        → nada a migrar (doramas v2 vazios).
 * - Já v2            → retorna os doramas existentes (sem re-migrar).
 * - v1               → migra, salva v2; se algo falhar (rede/quota), salva
 *                      parcial com migrationPending + lastError.
 */

export interface MigrationDeps {
  storage: StorageLike;
  fetchSeriesDetails: (tmdbId: string) => Promise<SeriesDetails>;
  fetchSeriesCast: (tmdbId: string) => Promise<CastResult[]>;
  resolveSeriesQids: (tmdbIds: string[]) => Promise<TmdbToQidMap>;
  fetchWikidataCast: (qids: string[]) => Promise<Map<string, WikidataCastRow[]>>;
  /** Resolve um path relativo de imagem TMDB p/ URL (ex.: imageUrl). */
  toTvImage?: (path: string) => string;
  onProgress?: (done: number, total: number) => void;
}

export interface MigrateResult {
  /** true se uma migração v1→v2 foi executada. */
  migrated: boolean;
  doramas: DoramaRecord[];
  /** Mensagem de erro parcial (migração incompleta) ou undefined. */
  error?: string;
}

function yearFromDate(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  const y = Number.parseInt(dateStr.slice(0, 4), 10);
  return Number.isFinite(y) ? y : null;
}

function failureMessage(failures: string[]): string | undefined {
  return failures.length > 0
    ? `Falha ao rehidratar ${failures.length} dorama(s): ${failures.join(", ")}`
    : undefined;
}

export async function migrateIfNeeded(deps: MigrationDeps): Promise<MigrateResult> {
  const raw = readRawDoc(deps.storage);

  // Sem dados — nada a migrar.
  if (raw === null) {
    return { migrated: false, doramas: [] };
  }

  // Já v2 — retorna o que existe.
  if (isV2Doc(raw)) {
    return { migrated: false, doramas: raw.doramas };
  }

  // v1 (ou formato desconhecido tratado como v1 se tiver nodes) → migra.
  if (!isV1Doc(raw)) {
    // JSON inválido/estranho: não migra, devolve vazio (a UI decide limpar).
    return { migrated: false, doramas: [], error: "Formato de dados não reconhecido" };
  }

  backupV1(raw, deps.storage);
  const source = doramasFromV1(raw);
  const total = source.length;
  if (total === 0) {
    // v1 sem doramas: apenas salva v2 vazio e encerra.
    persistPartial(deps, [], false);
    return { migrated: true, doramas: [] };
  }

  const failures: string[] = [];
  const done: DoramaRecord[] = [];

  try {
    const ids = source.map((d) => d.id);
    const qidMap = await deps.resolveSeriesQids(ids);
    const resolvedQids = ids
      .map((id) => qidMap[id])
      .filter((q): q is string => Boolean(q));
    const wikiCast = await deps.fetchWikidataCast(resolvedQids);

    for (let i = 0; i < ids.length; i++) {
      deps.onProgress?.(i, total);
      const sourceItem = source[i];
      const id = sourceItem.id;

      try {
        const [details, cast] = await Promise.all([
          deps.fetchSeriesDetails(id),
          deps.fetchSeriesCast(id),
        ]);

        const tmdbMembers = tmdbCastToMembers(cast, deps.toTvImage);
        const qid = qidMap[id];
        const wikiRows = qid ? wikiCast.get(qid) ?? [] : [];
        const merged = mergeCast(tmdbMembers, wikiRows);
        const withProtagonist = applyProtagonistHeuristic(merged);

        done.push({
          id,
          title: details.name || sourceItem.title,
          year: yearFromDate(details.first_air_date),
          overview: details.overview || undefined,
          posterUrl: details.poster_path && deps.toTvImage
            ? deps.toTvImage(details.poster_path)
            : undefined,
          addedAt: Date.now(),
          wikidataId: qid ?? null,
          cast: withProtagonist,
        });
      } catch (e) {
        failures.push(id);
        console.warn(`Falha ao migrar dorama ${id}`, e);
      }

      // Salvamento progressivo: nunca sobrescreve a chave v1 com um doc vazio
      // enquanto ainda existem doramas a processar.
      if (done.length > 0) {
        persistPartial(deps, done, failures.length > 0, failureMessage(failures));
      }
    }
  } catch (e) {
    // Erro de nível de lote (ex.: resolve/wikidata inteiro falhou).
    // Se NENHUM dorama foi processado, NÃO sobrescreve a chave v1 — deixa a
    // migração ser retentada depois (backup preservado).
    if (done.length === 0) {
      const msg = e instanceof Error ? e.message : "Falha na migração";
      return { migrated: false, doramas: [], error: msg };
    }
    const msg = e instanceof Error ? e.message : "Falha na migração";
    const saved = persistPartial(deps, done, true, msg);
    return {
      migrated: true,
      doramas: done,
      error: saved ? msg : "Falha ao salvar migração parcial",
    };
  }

  return {
    migrated: done.length > 0,
    doramas: done,
    error: failureMessage(failures),
  };
}

/** Persiste o doc v2; retorna false se o storage falhar (ex.: quota). */
function persistPartial(
  deps: MigrationDeps,
  doramas: DoramaRecord[],
  pending = false,
  lastError?: string,
): boolean {
  return writeV2Doc(
    doramas,
    pending ? { migrationPending: pending, lastError } : {},
    deps.storage,
  );
}
