import { X, Film, Users, FileDown, Trash2 } from "lucide-react";
import { SearchInput } from "../search/SearchInput";
import { useLocalStorageGraph } from "../../hooks/useLocalStorageGraph";
import { exportGraphToPdf } from "../../utils/exportPdf";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { nodes, links, clearGraphData, isEmpty } = useLocalStorageGraph();
  const doramaCount = nodes.filter((n) => n.group === "dorama").length;
  const actorCount = nodes.filter((n) => n.group === "actor").length;

  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight text-white">
          Dorama<span className="text-amber-400">Actors</span>
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] p-1.5 text-gray-500 transition-all hover:bg-white/10 hover:text-gray-300 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="group flex flex-1 flex-col gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-all duration-300 hover:border-amber-500/20 hover:bg-white/[0.06]">
          <div className="flex items-center gap-2">
            <Film className="h-3.5 w-3.5 text-amber-500/70" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
              Doramas
            </span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-amber-400 transition-all duration-300 group-hover:text-amber-300">
            {doramaCount}
          </span>
        </div>
        <div className="group flex flex-1 flex-col gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-all duration-300 hover:border-sky-500/20 hover:bg-white/[0.06]">
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-sky-500/70" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
              Actors
            </span>
          </div>
          <span className="text-3xl font-bold tracking-tight text-slate-300 transition-all duration-300 group-hover:text-white">
            {actorCount}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Add Dorama
        </h2>
        <SearchInput />
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3">
        <p className="text-center text-[11px] leading-relaxed text-gray-600">
          Click a dorama to see shared actors. Click an actor to search images.
        </p>
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <div className="space-y-2">
          <button
            onClick={() => exportGraphToPdf(nodes, links)}
            disabled={isEmpty}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-950/20 hover:text-amber-400 disabled:opacity-30 disabled:hover:border-white/[0.06] disabled:hover:bg-white/[0.03] disabled:hover:text-gray-400"
          >
            <FileDown className="h-4 w-4" />
            Exportar PDF
          </button>

          <button
            onClick={() => {
              if (window.confirm("Tem certeza? Todos os dados do gráfico serão perdidos.")) {
                clearGraphData();
              }
            }}
            disabled={isEmpty}
            className="flex w-full items-center gap-2.5 rounded-xl border border-red-500/15 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-400/80 transition-all duration-200 hover:border-red-500/30 hover:bg-red-950/40 hover:text-red-400 disabled:opacity-30 disabled:hover:border-red-500/15 disabled:hover:bg-red-950/20 disabled:hover:text-red-400/80"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Dados
          </button>
        </div>
      </div>
    </div>
  );
}
