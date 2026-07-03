import { useState, type FormEvent, useRef } from "react";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { useTMDB } from "../../hooks/useTMDB";
import { useLocalStorageGraph } from "../../hooks/useLocalStorageGraph";
import { transformDorama } from "../../utils/graphTransform";
import type { SearchResult } from "../../types/tmdb";

export function SearchInput() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [crossRefMsg, setCrossRefMsg] = useState<string | null>(null);
  const [duplicateMsg, setDuplicateMsg] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { search, fetchCast, loading, error } = useTMDB();
  const { nodes, addDorama } = useLocalStorageGraph();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
    setDuplicateMsg(null);
    setCrossRefMsg(null);
    const res = await search(query);
    setResults(res);
  };

  const handleSelect = async (s: SearchResult) => {
    const exists = nodes.some((n) => n.id === String(s.id));
    if (exists) {
      setDuplicateMsg(`"${s.name}" is already in your graph.`);
      return;
    }

    setAdding(s.name);
    setDuplicateMsg(null);
    setCrossRefMsg(null);
    try {
      const cast = await fetchCast(s.id);
      const { nodes: newNodes, links } = transformDorama(s, cast);
      const crossCount = await addDorama(newNodes, links);
      setQuery("");
      setResults([]);
      setSearched(false);
      if (crossCount > 0) {
        setCrossRefMsg(`${crossCount} actor${crossCount > 1 ? "s" : ""} already in your graph.`);
        setTimeout(() => setCrossRefMsg(null), 5000);
      }
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`flex items-center gap-1.5 rounded-xl border bg-white/[0.03] px-3 py-2.5 transition-all duration-300 ${
            focused
              ? "border-amber-500/40 shadow-lg shadow-amber-500/5"
              : "border-white/[0.06] hover:border-white/[0.12]"
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400/60" />
          ) : (
            <Search className={`h-4 w-4 shrink-0 transition-colors duration-300 ${focused ? "text-amber-400/60" : "text-gray-600"}`} />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search Dorama (title or IMDb ID)..."
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-gray-400 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-gray-200 disabled:opacity-30 disabled:hover:border-white/[0.06] disabled:hover:bg-white/[0.04] disabled:hover:text-gray-400"
          >
            Search
          </button>
        </div>
      </form>

      <div className="space-y-1 overflow-hidden">
        {error && (
          <p className="animate-in slide-in-from-top-1 fade-in rounded-lg border border-red-500/10 bg-red-950/40 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {duplicateMsg && (
          <p className="animate-in slide-in-from-top-1 fade-in rounded-lg border border-amber-500/10 bg-amber-950/30 px-3 py-2 text-xs text-amber-400">
            {duplicateMsg}
          </p>
        )}

        {crossRefMsg && (
          <p className="animate-in slide-in-from-top-1 fade-in rounded-lg border border-sky-500/10 bg-sky-950/30 px-3 py-2 text-xs text-sky-400">
            {crossRefMsg}
          </p>
        )}

        {searched && !loading && results.length === 0 && !error && (
          <p className="rounded-lg px-3 py-2 text-xs text-gray-600">
            No results found. Try a different search.
          </p>
        )}
      </div>

      {results.length > 0 && (
        <ul className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-xl">
          {results.map((s, i) => (
            <li
              key={s.id}
              className="animate-in slide-in-from-top-1 fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <button
                onClick={() => handleSelect(s)}
                disabled={adding === s.name}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-gray-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-gray-200 disabled:opacity-50"
              >
                {s.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${s.poster_path}`}
                    alt=""
                    className="h-11 w-8 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.04] bg-white/[0.02]">
                    <ExternalLink className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-100">{s.name}</div>
                  <div className="text-xs text-gray-600">
                    {s.first_air_date?.slice(0, 4) || "—"}
                  </div>
                </div>
                {adding === s.name && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400/60" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
