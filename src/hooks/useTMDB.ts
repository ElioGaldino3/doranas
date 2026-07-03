import { useState, useCallback } from "react";
import { searchSeries, findByImdbId, getSeriesCast } from "../services/tmdb";
import type { SearchResult, CastResult } from "../types/tmdb";

export function useTMDB() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const isImdb = /^tt\d{7,8}$/.test(query.trim());
      if (isImdb) {
        const data = await findByImdbId(query.trim());
        return data.tv_results ?? [];
      }
      const data = await searchSeries(query.trim());
      return data.results ?? [];
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Search failed";
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCast = useCallback(async (seriesId: number): Promise<CastResult[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSeriesCast(seriesId);
      return data.cast ?? [];
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch cast";
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, fetchCast, loading, error };
}
