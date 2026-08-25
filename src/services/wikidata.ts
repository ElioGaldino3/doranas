import type {
  SparqlResults,
  WikidataCastRow,
  TmdbToQidMap,
} from "../types/wikidata";

/**
 * Cliente mínimo da API Wikidata Query Service (SPARQL).
 *
 * Fatos verificados (WDQS User Manual):
 * - Endpoint: https://query.wikidata.org/sparql | format=json → SPARQL 1.1 JSON
 * - Propriedades: P161 = cast member, P4983 = TMDB TV series ID,
 *   P4985 = TMDB person ID, P18 = image, P4633 = nome do personagem.
 * - Limites: 60s por query; 5 queries paralelas por IP; 60s de processamento
 *   por 60s por cliente; 429 + header Retry-After; User-Agent obrigatório.
 */

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const DEFAULT_USER_AGENT = "dorama-actors/0.1 (local-first dorama tracker)";

/** Prefixo da entidade Wikidata. */
export function qidFromUri(uri: string): string {
  return uri.replace(/^https?:\/\/www\.wikidata\.org\/entity\//, "");
}

interface SparqlOptions {
  /** Permite injetar fetch para testes; default = global fetch. */
  fetchImpl?: typeof fetch;
  userAgent?: string;
  signal?: AbortSignal;
}

/**
 * Executa uma query SPARQL e retorna o JSON normalizado.
 * Lança em erro HTTP; em 429 tenta ler Retry-After antes de rejeitar
 * (o retry/pacing real é feito por quem chama em lote).
 */
export async function sparqlQuery(
  query: string,
  opts: SparqlOptions = {},
): Promise<SparqlResults> {
  const _fetch = opts.fetchImpl ?? fetch;
  const ua = opts.userAgent ?? DEFAULT_USER_AGENT;

  const url = new URL(SPARQL_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");

  const res = await _fetch(url.toString(), {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": ua,
    },
    signal: opts.signal,
  });

  if (!res.ok) {
    const retryAfter = res.headers.get("Retry-After");
    throw new WikidataHttpError(res.status, retryAfter);
  }

  return (await res.json()) as SparqlResults;
}

export class WikidataHttpError extends Error {
  readonly status: number;
  readonly retryAfterMs: number | null;

  constructor(status: number, retryAfter?: string | null) {
    const parsed = retryAfter ? Number.parseInt(retryAfter, 10) : NaN;
    const retryAfterMs = Number.isFinite(parsed) ? parsed * 1000 : null;
    super(`Wikidata SPARQL ${status}${retryAfterMs ? ` (retry in ${retryAfterMs}ms)` : ""}`);
    this.name = "WikidataHttpError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

/**
 * Resolve TMDB TV ids → Wikidata QIDs com UMA query (VALUES).
 * Retorna apenas os ids que possuem QID correspondente.
 *
 * Exemplo validado ao vivo: VALUES { "52" ... } → Q208072 (That '70s Show).
 */
export async function resolveSeriesQidsByTmdbIds(
  tmdbIds: Iterable<string>,
  opts: SparqlOptions = {},
): Promise<TmdbToQidMap> {
  const ids = [...new Set(tmdbIds)].filter((id) => id.length > 0);
  if (ids.length === 0) return {};

  const values = ids.map((id) => `"${escapeLiteral(id)}"`).join(" ");
  const query = `
SELECT ?item ?tmdb WHERE {
  VALUES ?tmdb { ${values} }
  ?item wdt:P4983 ?tmdb .
}`;

  const data = await sparqlQuery(query, opts);
  const map: TmdbToQidMap = {};
  for (const b of data.results.bindings) {
    if (b.item?.value && b.tmdb?.value) {
      map[b.tmdb.value] = qidFromUri(b.item.value);
    }
  }
  return map;
}

/** Query de elenco validada: P161 + P4985 (TMDB person) + P18 (imagem). */
function castQuery(qid: string): string {
  return `
SELECT ?actor ?actorLabel ?tmdbPerson ?img WHERE {
  wd:${qid} wdt:P161 ?actor .
  OPTIONAL { ?actor wdt:P4985 ?tmdbPerson }
  OPTIONAL { ?actor wdt:P18 ?img }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
}`;
}

/**
 * Busca o elenco de uma série (por QID) no Wikidata.
 * Preserva a ordem de chegada do SPARQL; pode conter atores que o TMDB não
 * traz (ganho principal do Wikidata).
 */
export async function fetchCastForQid(
  qid: string,
  opts: SparqlOptions = {},
): Promise<WikidataCastRow[]> {
  if (!/^Q\d+$/.test(qid)) {
    throw new Error(`QID inválido: ${qid}`);
  }

  const data = await sparqlQuery(castQuery(qid), opts);
  const rows: WikidataCastRow[] = [];

  for (const b of data.results.bindings) {
    const actorUri = b.actor?.value;
    if (!actorUri) continue;

    const row: WikidataCastRow = {
      qid: qidFromUri(actorUri),
      name: b.actorLabel?.value ?? qidFromUri(actorUri),
    };
    if (b.tmdbPerson?.value) row.tmdbPersonId = b.tmdbPerson.value;
    if (b.img?.value) row.imageUrl = b.img.value;
    rows.push(row);
  }

  return rows;
}

/** Constrói uma query VALUES com pool de QIDs (para lote de elenco). */
export function castQueryForQids(qids: string[]): string {
  const values = qids.map((q) => `wd:${q}`).join(" ");
  return `
SELECT ?show ?actor ?actorLabel ?tmdbPerson ?img WHERE {
  VALUES ?show { ${values} }
  ?show wdt:P161 ?actor .
  OPTIONAL { ?actor wdt:P4985 ?tmdbPerson }
  OPTIONAL { ?actor wdt:P18 ?img }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
}`;
}

/** Escapa aspas/backslash num literal SPARQL. */
function escapeLiteral(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
