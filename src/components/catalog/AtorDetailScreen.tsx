import { useMemo, useState } from "react";
import { ArrowLeft, Film, GitMerge, Star, Users } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useCatalogActions } from "../../hooks/useCatalogActions";
import {
  actorsByAppearance,
  buildCanonicalIdMap,
  canonicalId,
  doramasOfPerson,
} from "../../utils/derivations";
import { thumbUrl } from "../../utils/images";
import type { CastMember } from "../../types/models";

/** Tela de detalhe de um ator: foto + doramas em que aparece. */
export function AtorDetailScreen({ personId }: { personId: string }) {
  const doramas = useCatalogStore((s) => s.doramas);
  const aliases = useCatalogStore((s) => s.actorAliases);
  const navigate = useCatalogStore((s) => s.navigate);
  const { mergeActorAlias } = useCatalogActions();
  const [mergeTarget, setMergeTarget] = useState("");
  const [mergeMsg, setMergeMsg] = useState<string | null>(null);

  // `personId` é o id canônico do ator; busca por ele (e não pelo `personId`
  // cru do membro) para achar o ator mesmo quando o dorama o armazena sob um
  // id divergente (TMDB id vs Wikidata QID).
  const actor = useMemo<CastMember | null>(() => {
    const map = buildCanonicalIdMap(doramas, aliases);
    for (const d of doramas) {
      const m = d.cast.find((c) => canonicalId(c, map, aliases) === personId);
      if (m) return m;
    }
    return null;
  }, [doramas, personId, aliases]);

  const appearances = useMemo(
    () =>
      doramasOfPerson(doramas, personId, aliases).sort(
        (a, b) => (b.year ?? 0) - (a.year ?? 0),
      ),
    [doramas, personId, aliases],
  );

  // Outros atores candidatos a merge manual (exclui o atual).
  const mergeCandidates = useMemo(
    () => actorsByAppearance(doramas, aliases).filter((a) => a.personId !== personId),
    [doramas, aliases, personId],
  );

  const handleMerge = (targetId: string) => {
    if (!targetId || targetId === personId) return;
    mergeActorAlias(targetId, personId);
    setMergeTarget("");
    setMergeMsg("Atores mesclados com sucesso.");
    setTimeout(() => setMergeMsg(null), 6000);
  };

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
          {mergeCandidates.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-gray-400">
                <GitMerge className="h-4 w-4 text-sky-500/70" />
                <select
                  value={mergeTarget}
                  onChange={(e) => {
                    setMergeTarget(e.target.value);
                    handleMerge(e.target.value);
                  }}
                  className="cursor-pointer bg-transparent text-gray-200 focus:outline-none"
                  aria-label="Mesclar com outro ator"
                >
                  <option value="" className="bg-gray-900">
                    Mesclar com…
                  </option>
                  {mergeCandidates.map((a) => (
                    <option key={a.personId} value={a.personId} className="bg-gray-900">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {mergeMsg && (
        <p
          style={{ animation: "fadeIn 0.2s ease-out" }}
          className="mt-4 text-xs text-emerald-400"
        >
          {mergeMsg}
        </p>
      )}

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