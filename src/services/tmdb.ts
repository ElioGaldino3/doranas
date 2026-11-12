const TMDB_BASE = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

import type { CastResult, CreditsResponse, SeriesDetails } from "../types/tmdb";

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

async function getCredits<T>(path: string): Promise<{ cast: T[] }> {
  const res = await fetch(fullUrl(path));
  if (!res.ok) throw new Error("Falha ao consultar o elenco no TMDB.");
  return res.json();
}

export async function getSeriesCast(seriesId: number): Promise<CreditsResponse & { partial: boolean }> {
  const [regular, aggregate] = await Promise.allSettled([
    getCredits<CastResult>(`/tv/${seriesId}/credits`),
    getCredits<Omit<CastResult, "character"> & { roles?: { character: string }[] }>(
      `/tv/${seriesId}/aggregate_credits`,
    ),
  ]);
  if (regular.status === "rejected" && aggregate.status === "rejected") {
    throw new Error("Falha ao consultar o elenco no TMDB.");
  }

  const cast = new Map<number, CastResult>();
  for (const actor of regular.status === "fulfilled" ? regular.value.cast : []) {
    cast.set(actor.id, actor);
  }
  if (aggregate.status === "fulfilled") {
    const hasRegularCast = cast.size > 0;
    for (const actor of aggregate.value.cast) {
      if (!cast.has(actor.id)) {
        cast.set(actor.id, {
          id: actor.id,
          name: actor.name,
          profile_path: actor.profile_path,
          character: actor.roles?.[0]?.character ?? "",
          supporting: hasRegularCast,
        });
      }
    }
  }
  return {
    cast: [...cast.values()],
    partial: regular.status === "rejected" || aggregate.status === "rejected",
  };
}

export async function getExpandedSeriesCast(seriesId: number): Promise<CreditsResponse & { partial: boolean }> {
  const [credits, details] = await Promise.allSettled([
    getSeriesCast(seriesId),
    getSeriesDetails(seriesId),
  ]);
  const cast = new Map(
    credits.status === "fulfilled" ? credits.value.cast.map((actor) => [actor.id, actor]) : [],
  );
  let partial = credits.status === "rejected" || credits.value.partial || details.status === "rejected";
  let successful = credits.status === "fulfilled";

  if (details.status === "fulfilled") {
    for (const { season_number } of details.value.seasons ?? []) {
      try {
        const response = await fetch(fullUrl(`/tv/${seriesId}/season/${season_number}`));
        if (!response.ok) throw new Error("Falha ao consultar a temporada.");
        const season: { episodes: { guest_stars?: CastResult[] }[] } = await response.json();
        for (const episode of season.episodes) {
          for (const actor of episode.guest_stars ?? []) {
            if (!cast.has(actor.id)) cast.set(actor.id, { ...actor, supporting: true });
          }
        }
        successful = true;
      } catch {
        partial = true;
      }
    }
  }

  if (!successful) throw new Error("Falha ao consultar o elenco no TMDB.");
  return { cast: [...cast.values()], partial };
}

/** Detalhes de uma série (título, ano, sinopse, poster). */
export async function getSeriesDetails(seriesId: string | number): Promise<SeriesDetails> {
  const res = await fetch(fullUrl(`/tv/${seriesId}`));
  if (!res.ok) throw new Error("Failed to fetch series details");
  return res.json();
}
