import { useMemo } from "react";
import { ArrowLeft, Film, Star, Users } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { doramasOfPerson } from "../../utils/derivations";
import { thumbUrl } from "../../utils/images";
import type { CastMember } from "../../types/models";

/** Tela de detalhe de um ator: foto + doramas em que aparece. */
export function AtorDetailScreen({ personId }: { personId: string }) {
  const doramas = useCatalogStore((s) => s.doramas);
  const navigate = useCatalogStore((s) => s.navigate);

  const actor = useMemo<CastMember | null>(() => {
    for (const d of doramas) {
      const m = d.cast.find((c) => c.personId === personId);
      if (m) return m;
    }
    return null;
  }, [doramas, personId]);

  const appearances = useMemo(
    () =>
      doramasOfPerson(doramas, personId).sort(
        (a, b) => (b.year ?? 0) - (a.year ?? 0),
      ),
    [doramas, personId],
  );

  if (!actor) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-400">Ator não encontrado no catálogo.</p>
        <button
          onClick={() => navigate({ name: "atores" })}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:border-sky-500/30 hover:text-sky-400"
        >
          Voltar para Atores
        </button>
      </div>
    );
  }

  const imgSrc = thumbUrl(actor.profileImgUrl);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <button
        onClick={() => navigate({ name: "atores" })}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" /> Atores
      </button>

      <div className="flex items-center gap-5">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={actor.name}
            className="h-24 w-24 shrink-0 rounded-2xl border border-white/[0.06] object-cover sm:h-32 sm:w-32"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] sm:h-32 sm:w-32">
            <span className="text-4xl font-bold text-gray-600">{actor.name.charAt(0)}</span>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-white">{actor.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="h-4 w-4 text-sky-500/70" />
            {appearances.length} {appearances.length === 1 ? "aparição" : "aparições"}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Doramas
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {appearances.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate({ name: "dorama-detail", doramaId: a.id })}
              className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-all duration-200 hover:border-sky-500/25 hover:bg-white/[0.06]"
            >
              {a.protagonist ? (
                <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              ) : (
                <Film className="h-4 w-4 shrink-0 text-gray-600" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-100">{a.title}</p>
                <p className="text-xs text-gray-500">
                  {a.year ?? "—"}
                  {a.protagonist ? " · protagonista" : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}