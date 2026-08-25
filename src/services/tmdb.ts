const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

import type { SeriesDetails } from "../types/tmdb";

function apiKey(): string {
  return import.meta.env.VITE_TMDB_API_KEY;
}

function fullUrl(path: string, params: Record<string, string> = {}): string {
  const search = new URLSearchParams({ language: "pt-BR", ...params, api_key: apiKey() });
  return `${TMDB_BASE}${path}?${search}`;
}

export function imageUrl(path: string | null): string {
  return path ? `${IMG_BASE}${path}` : "";
}

export async function searchSeries(query: string) {
  const res = await fetch(fullUrl("/search/tv", { query }));
  if (!res.ok) throw new Error("Failed to search series");
  return res.json();
}

export async function findByImdbId(imdbId: string) {
  const res = await fetch(fullUrl(`/find/${imdbId}`, { external_source: "imdb_id" }));
  if (!res.ok) throw new Error("Failed to find by IMDb ID");
  return res.json();
}

export async function getSeriesCast(seriesId: number) {
  const res = await fetch(fullUrl(`/tv/${seriesId}/credits`));
  if (!res.ok) throw new Error("Failed to fetch cast");
  return res.json();
}

/** Detalhes de uma série (título, ano, sinopse, poster). */
export async function getSeriesDetails(seriesId: string | number): Promise<SeriesDetails> {
  const res = await fetch(fullUrl(`/tv/${seriesId}`));
  if (!res.ok) throw new Error("Failed to fetch series details");
  return res.json();
}
