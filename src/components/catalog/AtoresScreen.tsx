import { useMemo } from "react";
import { Users } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { actorsByAppearance } from "../../utils/derivations";
import { thumbUrl } from "../../utils/images";
import type { ActorAppearance } from "../../utils/derivations";

/** Tela "Atores": agregado de elenco por nº de aparições. */
export function AtoresScreen() {
  const doramas = useCatalogStore((s) => s.doramas);
  const navigate = useCatalogStore((s) => s.navigate);
  const actors = useMemo(() => actorsByAppearance(doramas), [doramas]);

  if (actors.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.03]">
          <Users className="h-8 w-8 text-sky-500/40" />
        </div>
        <p className="text-lg font-medium text-gray-400">Nenhum ator ainda</p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-600">
          Adicione doramas ao catálogo para ver os atores que reaparecem entre eles.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-white">Atores</h2>
        <p className="text-sm text-gray-500">
          {actors.length} {actors.length === 1 ? "ator" : "atores"} ordenados por aparições
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actors.map((a) => (
          <ActorCard
            key={a.personId}
            actor={a}
            onOpen={() => navigate({ name: "ator-detail", personId: a.personId })}
          />
        ))}
      </div>
    </div>
  );
}

function ActorCard({ actor, onOpen }: { actor: ActorAppearance; onOpen: () => void }) {
  const imgSrc = thumbUrl(actor.profileImgUrl);
  return (
    <button
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition-all duration-200 hover:border-sky-500/25 hover:bg-white/[0.06]"
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={actor.name}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-xl border border-white/[0.06] object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <span className="text-lg font-bold text-gray-600">{actor.name.charAt(0)}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-100">{actor.name}</p>
        <p className="text-xs text-gray-500">
          {actor.appearances} {actor.appearances === 1 ? "aparição" : "aparições"}
        </p>
      </div>
    </button>
  );
}