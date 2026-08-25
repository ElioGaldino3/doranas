import { useMemo } from "react";
import { BarChart3, Film, Star, Users } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { computeStats } from "../../utils/stats";
import { thumbUrl } from "../../utils/images";

/** Tela de estatísticas: totais, top atores e distribuição por ano. */
export function EstatisticasScreen() {
  const doramas = useCatalogStore((s) => s.doramas);
  const aliases = useCatalogStore((s) => s.actorAliases);
  const navigate = useCatalogStore((s) => s.navigate);

  const stats = useMemo(() => computeStats(doramas, aliases), [doramas, aliases]);
  const maxYearCount = stats.byYear.reduce((m, b) => Math.max(m, b.count), 0);

  if (doramas.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.03]">
          <BarChart3 className="h-8 w-8 text-amber-500/40" />
        </div>
        <p className="text-lg font-medium text-gray-400">Sem estatísticas ainda</p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-600">
          Adicione doramas ao catálogo para ver totais, atores recorrentes e distribuição por ano.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h2 className="mb-6 text-xl font-bold tracking-tight text-white">Estatísticas</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Film className="h-5 w-5" />} value={stats.doramaCount} label="Doramas" />
        <StatCard icon={<Users className="h-5 w-5" />} value={stats.actorCount} label="Atores" />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} value={stats.appearanceCount} label="Aparições" />
        <StatCard icon={<Star className="h-5 w-5" />} value={stats.protagonistCount} label="Protagonistas" />
      </div>

      <section className="mt-8">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Atores mais recorrentes
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.topActors.map((a) => (
            <button
              key={a.personId}
              onClick={() => navigate({ name: "ator-detail", personId: a.personId })}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-all duration-200 hover:border-sky-500/25 hover:bg-white/[0.06]"
            >
              {a.profileImgUrl ? (
                <img
                  src={thumbUrl(a.profileImgUrl)}
                  alt={a.name}
                  className="h-12 w-12 shrink-0 rounded-xl border border-white/[0.06] object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="text-base font-bold text-gray-600">{a.name.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-100">{a.name}</p>
                <p className="text-xs text-gray-500">
                  {a.appearances} {a.appearances === 1 ? "aparição" : "aparições"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Doramas por ano
        </h3>
        <div className="flex flex-col gap-2">
          {stats.byYear.map((b) => (
            <div key={String(b.year)} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-right text-xs text-gray-500">{b.year}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                <div
                  className="h-full rounded-full bg-amber-500/70"
                  style={{ width: `${maxYearCount > 0 ? (b.count / maxYearCount) * 100 : 0}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-xs text-gray-400">{b.count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="mb-2 text-amber-400/80">{icon}</div>
      <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
