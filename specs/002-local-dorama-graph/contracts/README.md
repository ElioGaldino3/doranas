# Contracts: Local Dorama Graph Tracker

This is a single-page application (SPA) with no external API surface.
The interface contracts are between the application's internal layers:

## Hook Contracts

### `useLocalStorageGraph()`

```
Returns: {
  nodes: Node[],
  links: Link[],
  highlightedNodes: Set<string>,
  addDorama: (tmdbSeriesId: number) => Promise<{ crossReferenced: string[] }>,
  clearHighlights: () => void,
  isEmpty: boolean,
}
```

Side effects:
- Reads/writes `dorama_graph_data` in localStorage
- Triggers Zustand store updates on mutation

### `useTMDB()`

```
Returns: {
  search: (query: string) => Promise<SearchResult[]>,
  fetchCast: (seriesId: number) => Promise<CastResult[]>,
  loading: boolean,
  error: string | null,
}
```

Side effects:
- Makes HTTP requests to TMDB API v3
- Auto-detects IMDb ID format vs text query

## External API Contract

### TMDB API v3

- `GET /search/tv?query={title}&language=en-US`
- `GET /find/{imdbId}?external_source=imdb_id`
- `GET /tv/{seriesId}/credits?language=en-US`

All requests require `api_key` query parameter sourced from
`import.meta.env.VITE_TMDB_API_KEY`.

## Data Contract

See [data-model.md](../data-model.md) for the `dorama_graph_data`
localStorage schema (GraphDocument → Node[], Link[]).
