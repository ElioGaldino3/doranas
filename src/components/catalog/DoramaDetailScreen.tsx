import { useMemo, useState } from "react";
import { ArrowLeft, Check, Film, Loader2, Pencil, Sparkles, Star, Trash2, X } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useCatalogActions } from "../../hooks/useCatalogActions";
import { useRehydrate } from "../../hooks/useRehydrate";
import { getExpandedSeriesCast, imageUrl } from "../../services/tmdb";
import { applyProtagonistHeuristic, buildCanonicalIdMap, canonicalId, otherDoramasOf, tmdbCastToMembers } from "../../utils/derivations";
import { thumbUrl } from "../../utils/images";
import type { CastMember, DoramaRecord } from "../../types/models";

/** Tela de detalhe de um dorama: sinopse + elenco com cross-refs de atores. */
export function DoramaDetailScreen({ doramaId }: { doramaId: string }) {
  const doramas = useCatalogStore((s) => s.doramas);
  const aliases = useCatalogStore((s) => s.actorAliases);
  const navigate = useCatalogStore((s) => s.navigate);
  const { removeDorama, updateDorama } = useCatalogActions();
  const { rehydrateOne, busy: rehydrating, error: rehydrateError } = useRehydrate();
  const [enrichedMsg, setEnrichedMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [yearDraft, setYearDraft] = useState("");
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

  const startEdit = () => {
    setTitleDraft(dorama.title);
    setYearDraft(dorama.year?.toString() ?? "");
    setEditing(true);
  };

  const refreshCast = async () => {
    setRefreshing(true);
    setRefreshStatus("");
    try {
      const result = await getExpandedSeriesCast(Number(dorama.id));
      const { doramas, actorAliases } = useCatalogStore.getState();
      const current = doramas.find((record) => record.id === dorama.id);
      if (!current) return;

      const candidates = applyProtagonistHeuristic(tmdbCastToMembers(result.cast, imageUrl));
      const map = buildCanonicalIdMap(doramas, actorAliases);
      const seen = new Set(current.cast.map((member) => canonicalId(member, map, actorAliases)));
      const additions = candidates.filter((member) => {
        const id = canonicalId(member, map, actorAliases);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      if (additions.length && !updateDorama({ ...current, cast: [...current.cast, ...additions] })) {
        throw new Error("Falha ao salvar o elenco no catálogo.");
      }
      const message = additions.length === 0
        ? "Nenhum ator novo encontrado."
        : additions.length === 1
          ? "1 ator adicionado ao elenco."
          : `${additions.length} atores adicionados ao elenco.`;
      setRefreshStatus(result.partial ? `${message} Parte da consulta ao TMDB falhou.` : message);
    } catch (error) {
      setRefreshStatus(error instanceof Error ? error.message : "Falha ao atualizar o elenco.");
    } finally {
      setRefreshing(false);
    }
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    const yearRaw = yearDraft.trim();
    const year = yearRaw === "" ? null : Number(yearRaw);
    updateDorama({
      ...dorama,
      title: titleDraft.trim() || dorama.title,
      year: year !== null && Number.isFinite(year) ? year : null,
    });
    setEditing(false);
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
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                aria-label="Título do dorama"
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500/30"
              />
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={yearDraft}
                  onChange={(e) => setYearDraft(e.target.value)}
                  aria-label="Ano de estreia"
                  placeholder="Ano"
                  className="w-28 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-gray-100 outline-none focus:border-amber-500/30"
                />
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-2.5 text-sm font-medium text-emerald-400 transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-950/50 hover:text-emerald-300"
                >
                  <Check className="h-4 w-4" /> Salvar
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:border-white/[0.12] hover:text-gray-200"
                >
                  <X className="h-4 w-4" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {dorama.title}
                {dorama.year ? (
                  <span className="ml-2 text-lg font-semibold text-gray-500">{dorama.year}</span>
                ) : null}
              </h2>
              <button
                onClick={startEdit}
                aria-label="Editar metadados do dorama"
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-xs font-medium text-gray-400 transition-all duration-200 hover:border-amber-500/30 hover:text-amber-400"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
            </div>
          )}
          {dorama.overview && (
            <p className="mt-3 text-sm leading-relaxed text-gray-400">{dorama.overview}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {dorama.wikidataId == null && (
              <button
                onClick={handleEnrich}
                disabled={rehydrating || refreshing}
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Elenco · {dorama.cast.length} {dorama.cast.length === 1 ? "ator" : "atores"}
          </h3>
          <button
            type="button"
            onClick={refreshCast}
            disabled={refreshing || rehydrating}
            className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-sky-950/30 px-4 py-2.5 text-sm font-medium text-sky-400 hover:border-sky-500/40 disabled:opacity-40"
          >
            {refreshing && <Loader2 className="h-4 w-4 animate-spin" />}
            {refreshing ? "Buscando atores…" : "Buscar mais atores"}
          </button>
        </div>
        <p role="status" className={refreshStatus ? "mb-4 text-sm text-gray-400" : "sr-only"}>
          {refreshStatus}
        </p>
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
