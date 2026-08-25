/**
 * Tipos para o serviço Wikidata (SPARQL Query Service).
 *
 * O endpoint retorna o formato "SPARQL 1.1 Query Results JSON":
 * { results: { bindings: [ { "?var": { type, value } } ] } }.
 * Cada binding é uma entrada; cada variável pode ter type/value + datatype.
 */

export interface SparqlBindingValue {
  type: "uri" | "literal" | "typed-literal" | "bnode";
  value: string;
  datatype?: string;
  "xml:lang"?: string;
}

export type SparqlBinding = Record<string, SparqlBindingValue>;

export interface SparqlResults {
  results: {
    bindings: SparqlBinding[];
  };
}

/** Linha normalizada de um membro do elenco vindo do Wikidata. */
export interface WikidataCastRow {
  /** Wikidata QID (ex.: "Q2263") — sem o prefixo http://www.wikidata.org/entity/ */
  qid: string;
  /** Label do ator (pt, com fallback en) */
  name: string;
  /** TMDB person ID (propriedade P4985), se existir no item */
  tmdbPersonId?: string;
  /** Imagem principal (propriedade P18), se houver — URL completa */
  imageUrl?: string;
}

/** Resolução de TMDB TV id → Wikidata QID. */
export type TmdbToQidMap = Record<string, string>;
