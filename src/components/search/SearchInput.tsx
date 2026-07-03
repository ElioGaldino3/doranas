import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";
import { useTMDB } from "../../hooks/useTMDB";
import { useGraph } from "../../hooks/useGraph";
import { transformDorama } from "../../utils/graphTransform";
import type { SearchResult } from "../../types/tmdb";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const { search, fetchCast, loading, error } = useTMDB();
  const { addDorama } = useGraph();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
    const res = await search(query);
    setResults(res);
  };

  const handleSelect = async (s: SearchResult) => {
    setAdding(s.name);
    try {
      const cast = await fetchCast(s.id);
      const { nodes, links } = transformDorama(s, cast);
      await addDorama(nodes, links);
      setQuery("");
      setResults([]);
      setSearched(false);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Dorama (title or IMDb ID)..."
          className="min-w-0 flex-1 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-gray-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <p className="text-sm text-gray-500">No results found. Try a different search.</p>
      )}

      {results.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded border border-gray-700 bg-gray-900 p-1">
          {results.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => handleSelect(s)}
                disabled={adding === s.name}
                className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-gray-300 transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {s.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                    alt=""
                    className="h-10 w-7 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-100">{s.name}</div>
                  <div className="text-xs text-gray-500">{s.first_air_date?.slice(0, 4)}</div>
                </div>
                {adding === s.name && (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
