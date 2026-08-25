import { useMemo, useState } from "react";
import { ArrowLeft, Film, Loader2, Sparkles, Star, Trash2 } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useCatalogActions } from "../../hooks/useCatalogActions";
import { useRehydrate } from "../../hooks/useRehydrate";
import { buildCanonicalIdMap, canonicalId, otherDoramasOf } from "../../utils/derivations";
import { thumbUrl } from "../../utils/images";
import type { CastMember, DoramaRecord } from "../../types/models";

/** Tela de detalhe de um dorama: sinopse + elenco com cross-refs de atores. */
export function DoramaDetailScreen({ doramaId }: { doramaId: string }) {
  const doramas = useCatalogStore((s) => s.doramas);
  const aliases = useCatalogStore((s) => s.actorAliases);
  const navigate = useCatalogStore((s) => s.navigate);
  const { removeDorama } = useCatalogActions();
  const { rehydrateOne, busy: rehydrating, error: rehydrateError } = useRehydrate();
  const [enrichedMsg, setEnrichedMsg] = useState<string | null>(null);
  const canonicalMap = useMemo(
    () => buildCanonicalIdMap(doramas, aliases),
    [doramas, aliases],
  );
  const dorama = doramas.find((d) => d.id === doramaId);

  if (!dorama) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-400">Dorama não encontrado no catálogo.</p>
        <button
          onClick={() => navigate({ name: "doramas" })}
          className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:border-amber-500/30 hover:text-amber-400"
        >
          Voltar para Doramas
        </button>
      </div>
    );
  }

  const handleRemove = () => {
    if (window.confirm(`Remover "${dorama.title}" do catálogo?`)) {
      removeDorama(dorama.id);
      navigate({ name: "doramas" });
    }
  };

  const handleEnrich = async () => {
    setEnrichedMsg(null);
    const n = await rehydrateOne(dorama.id);
    if (n > 0) {
      setEnrichedMsg("Elenco enriquecido com o Wikidata.");
      setTimeout(() => setEnrichedMsg(null), 5000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <button
        onClick={() => navigate({ name: "doramas" })}
        className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" /> Doramas
      </button>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-full shrink-0 sm:w-56">
          {dorama.posterUrl ? (
            <img
              src={dorama.posterUrl}
              alt={dorama.title}
              className="aspect-[2/3] w-full rounded-2xl border border-white/[0.06] object-cover"
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <Film className="h-10 w-10 text-amber-500/30" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {dorama.title}
            {dorama.year ? (
              <span className="ml-2 text-lg font-semibold text-gray-500">{dorama.year}</span>
            ) : null}
          </h2>
          {dorama.overview && (
            <p className="mt-3 text-sm leading-relaxed text-gray-400">{dorama.overview}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {dorama.wikidataId == null && (
              <button
                onClick={handleEnrich}
                disabled={rehydrating}
                className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-950/30 px-4 py-2.5 text-sm font-medium text-sky-400 transition-all duration-200 hover:border-sky-500/40 hover:bg-sky-950/50 hover:text-sky-300 disabled:opacity-40"
              >
                {rehydrating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Enriquecer elenco (Wikidata)
              </button>
            )}
            <button
              onClick={handleRemove}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-950/50 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" /> Remover Dorama
            </button>
          </div>
          {enrichedMsg && (
            <p
              style={{ animation: "fadeIn 0.2s ease-out" }}
              className="mt-3 text-xs text-emerald-400"
            >
              {enrichedMsg}
            </p>
          )}
          {rehydrateError && (
            <p
              style={{ animation: "fadeIn 0.2s ease-out" }}
              className="mt-3 text-xs text-red-400"
            >
              {rehydrateError}
            </p>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
          Elenco · {dorama.cast.length} {dorama.cast.length === 1 ? "ator" : "atores"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {dorama.cast.map((member) => (
            <CastRow
              key={member.personId}
              dorama={dorama}
              member={member}
              canonicalPersonId={canonicalId(member, canonicalMap, aliases)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CastRow({
  dorama,
  member,
  canonicalPersonId,
}: {
  dorama: DoramaRecord;
  member: CastMember;
  canonicalPersonId: string;
}) {
  const doramas = useCatalogStore((s) => s.doramas);
  const aliases = useCatalogStore((s) => s.actorAliases);
  const navigate = useCatalogStore((s) => s.navigate);
  const others = otherDoramasOf(doramas, canonicalPersonId, dorama.id, aliases);
  const imgSrc = thumbUrl(member.profileImgUrl);

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 transition-colors duration-200 hover:border-white/[0.12]">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={member.name}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-xl border border-white/[0.06] object-cover"
        />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
          <span className="text-lg font-bold text-gray-600">{member.name.charAt(0)}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <button
          onClick={() => navigate({ name: "ator-detail", personId: canonicalPersonId })}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-100 transition-colors hover:text-white"
        >
          <span className="truncate">{member.name}</span>
          {member.protagonist && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
          )}
        </button>

        {others.length > 0 && (
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            Também em{" "}
            {others.map((o, i) => (
              <span key={o.id}>
                <button
                  onClick={() => navigate({ name: "dorama-detail", doramaId: o.id })}
                  className="text-amber-400/90 underline decoration-amber-500/30 underline-offset-2 transition-colors hover:text-amber-300"
                >
                  {o.title}
                </button>
                {i < others.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}