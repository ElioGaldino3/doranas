import { useState } from "react";
import { Film, FileDown, Loader2, Sparkles, Star, Trash2 } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useCatalogActions } from "../../hooks/useCatalogActions";
import { useRehydrate } from "../../hooks/useRehydrate";
import { buildDoramaPdf, loadCjkFont, type ExportDorama } from "../../utils/exportPdf";
import type { DoramaRecord } from "../../types/models";

/** Tela "Doramas": grade de cards do catálogo + ações de exportar PDF e limpar. */
export function DoramasScreen() {
  const doramas = useCatalogStore((s) => s.doramas);
  const navigate = useCatalogStore((s) => s.navigate);
  const { clearAll } = useCatalogActions();
  const { rehydrateAll, busy: syncing, progress: syncProgress, error: syncError } = useRehydrate();
  const [syncedMsg, setSyncedMsg] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const pendingCount = doramas.filter((d) => d.wikidataId == null).length;

  const handleExportPdf = async () => {
    if (doramas.length === 0) return;
    setPdfBusy(true);
    try {
      // Fonte CJK: baixa sob demanda; sem ela (falha/offline) cai na helvetica.
      const cjkFont = await loadCjkFont().catch(() => undefined);
      const list: ExportDorama[] = doramas.map((d) => ({
        id: d.id,
        title: d.title,
        year: d.year,
        actorCount: d.cast.length,
      }));
      const pdf = buildDoramaPdf(list, cjkFont ? { cjkFont } : undefined);
      pdf.save("doramas-assistidos.pdf");
    } finally {
      setPdfBusy(false);
    }
  };

  const handleSync = async () => {
    setSyncedMsg(null);
    const n = await rehydrateAll();
    if (n > 0) {
      setSyncedMsg(
        `${n} ${n === 1 ? "dorama enriquecido" : "doramas enriquecidos"} com o Wikidata.`,
      );
      setTimeout(() => setSyncedMsg(null), 6000);
    }
  };

  const handleClear = () => {
    if (window.confirm("Tem certeza? Todos os doramas serão removidos do catálogo.")) {
      clearAll();
    }
  };

  if (doramas.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.03]">
          <Film className="h-8 w-8 text-amber-500/40" />
        </div>
        <p className="text-lg font-medium text-gray-400">Seu catálogo está vazio</p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-600">
          Busque um dorama pelo título ou IMDb ID na barra superior para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Doramas</h2>
          <p className="text-sm text-gray-500">
            {doramas.length} {doramas.length === 1 ? "dorama" : "doramas"} no catálogo
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPdf}
            disabled={pdfBusy}
            className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-950/20 hover:text-amber-400 disabled:opacity-40"
          >
            {pdfBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {pdfBusy ? "Preparando PDF…" : "Exportar PDF"}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing || pendingCount === 0}
            className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-950/20 px-4 py-2.5 text-sm font-medium text-sky-400 transition-all duration-200 hover:border-sky-500/40 hover:bg-sky-950/40 hover:text-sky-300 disabled:opacity-30 disabled:hover:border-sky-500/20 disabled:hover:bg-sky-950/20 disabled:hover:text-sky-400"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Sincronizar Wikidata
            {pendingCount > 0 && (
              <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 rounded-xl border border-red-500/15 bg-red-950/20 px-4 py-2.5 text-sm font-medium text-red-400/80 transition-all duration-200 hover:border-red-500/30 hover:bg-red-950/40 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Limpar Dados
          </button>
        </div>
      </div>

      {syncing && syncProgress && (
        <p className="mb-4 text-xs text-sky-400">
          Sincronizando com o Wikidata… {syncProgress.done} de {syncProgress.total}
        </p>
      )}
      {syncedMsg && (
        <p
          style={{ animation: "fadeIn 0.2s ease-out" }}
          className="mb-4 text-xs text-emerald-400"
        >
          {syncedMsg}
        </p>
      )}
      {syncError && (
        <p
          style={{ animation: "fadeIn 0.2s ease-out" }}
          className="mb-4 text-xs text-red-400"
        >
          {syncError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {doramas.map((d) => (
          <DoramaCard
            key={d.id}
            dorama={d}
            onOpen={() => navigate({ name: "dorama-detail", doramaId: d.id })}
          />
        ))}
      </div>
    </div>
  );
}

function DoramaCard({ dorama, onOpen }: { dorama: DoramaRecord; onOpen: () => void }) {
  const protagonists = dorama.cast.filter((m) => m.protagonist).length;
  return (
    <button
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] text-left transition-all duration-300 hover:border-amber-500/25 hover:bg-white/[0.06]"
    >
      {dorama.posterUrl ? (
        <img
          src={dorama.posterUrl}
          alt={dorama.title}
          loading="lazy"
          className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-white/[0.02]">
          <Film className="h-8 w-8 text-amber-500/30" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <span className="truncate text-sm font-semibold text-gray-100">{dorama.title}</span>
        <span className="text-xs text-gray-500">
          {dorama.year ?? "—"} · {dorama.cast.length} {dorama.cast.length === 1 ? "ator" : "atores"}
        </span>
        {protagonists > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-400/90">
            <Star className="h-3 w-3" /> {protagonists}{" "}
            {protagonists === 1 ? "protagonista" : "protagonistas"}
          </span>
        )}
      </div>
    </button>
  );
}