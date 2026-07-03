import { ForceGraph } from "../graph/ForceGraph";
import { useLocalStorageGraph } from "../../hooks/useLocalStorageGraph";
import { Search, Film, Users } from "lucide-react";

export function GraphCanvas() {
  const { isEmpty, storageError, nodes } = useLocalStorageGraph();
  const doramaCount = nodes.filter((n) => n.group === "dorama").length;
  const actorCount = nodes.filter((n) => n.group === "actor").length;

  return (
    <main className="relative flex flex-1 items-center justify-center bg-gray-950">
      {storageError && (
        <div style={{ animation: "fadeIn 0.2s ease-out" }} className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-xl border border-red-500/20 bg-red-950/80 px-5 py-3 text-sm text-red-400 shadow-2xl shadow-red-950/50 backdrop-blur-xl">
          {storageError}
        </div>
      )}

      {!isEmpty && (
        <div className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/[0.06] bg-black/60 px-5 py-2.5 text-xs text-gray-500 backdrop-blur-xl sm:flex">
          <span className="flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-amber-500/60" />
            <span className="font-medium text-gray-400">{doramaCount}</span> Doramas
          </span>
          <span className="h-3 w-px bg-white/[0.06]" />
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-sky-500/60" />
            <span className="font-medium text-gray-400">{actorCount}</span> Actors
          </span>
          <span className="h-3 w-px bg-white/[0.06]" />
          <span className="flex items-center gap-1.5">
            <Search className="h-3 w-3 text-gray-600" />
            Click an actor to search images
          </span>
        </div>
      )}

      {isEmpty ? (
        <div className="mx-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.03]">
            <Film className="h-8 w-8 text-amber-500/40" />
          </div>
          <p className="text-lg font-medium text-gray-400">
            Your graph is empty
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Search for a Kdrama from the sidebar to get started.
          </p>
        </div>
      ) : (
        <ForceGraph />
      )}
    </main>
  );
}
