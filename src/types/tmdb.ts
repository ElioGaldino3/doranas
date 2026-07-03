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
