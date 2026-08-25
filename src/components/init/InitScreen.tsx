import { Clapperboard, Loader2 } from "lucide-react";

export interface InitScreenProps {
  /** Progresso de migração v1→v2; null fora de migração (carga simples). */
  progress: { done: number; total: number } | null;
  /** Erro parcial da migração, se houver. */
  error?: string;
}

/** Splash exibido enquanto o App inicializa/executa a migração v1→v2. */
export function InitScreen({ progress, error }: InitScreenProps) {
  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.done / progress.total) * 100))
      : null;

  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center gap-6 bg-gray-950 px-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.03]">
        <Clapperboard className="h-9 w-9 text-amber-500/70" />
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Dorama<span className="text-amber-400">Actors</span>
        </h1>
        <p className="mt-1.5 flex items-center justify-center gap-2 text-sm text-gray-500">
          {progress ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400/70" />
              Migrando seus dados… {progress.done} de {progress.total}
            </>
          ) : (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400/70" />
              Carregando catálogo…
            </>
          )}
        </p>
      </div>

      {pct !== null && (
        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {error && (
        <p className="max-w-sm rounded-xl border border-amber-500/20 bg-amber-950/30 px-4 py-2.5 text-center text-xs leading-relaxed text-amber-400">
          {error}
        </p>
      )}
    </div>
  );
}