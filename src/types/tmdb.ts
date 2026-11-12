export interface SearchResult {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
}

export interface CastResult {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
  supporting?: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface FindResponse {
  tv_results: SearchResult[];
}

export interface CreditsResponse {
  cast: CastResult[];
}

/** Resposta de GET /tv/{id} (o que a migração usa). */
export interface SeriesDetails {
  id: number;
  name: string;
  first_air_date: string | null;
  overview: string;
  poster_path: string | null;
  seasons?: { season_number: number }[];
}
