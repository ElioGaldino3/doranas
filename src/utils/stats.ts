import type { DoramaRecord } from "../types/models";
import {
  actorsByAppearance,
  buildCanonicalIdMap,
  canonicalId,
  type ActorAppearance,
} from "./derivations";

/** Quantos atores do topo exibir no painel de estatísticas. */
export const TOP_ACTORS_N = 5;

export interface YearBucket {
  /** Ano do dorama, ou "—" quando ausente. */
  year: number | "—";
  count: number;
}

export interface CatalogStats {
  doramaCount: number;
  /** Atores canônicos únicos (dedup automático + manual via aliases). */
  actorCount: number;
  /** Total de aparições ator↔dorama (soma das aparições canônicas). */
  appearanceCount: number;
  /** Atores canônicos que já foram protagonista em algum dorama. */
  protagonistCount: number;
  topActors: ActorAppearance[];
  byYear: YearBucket[];
}

/**
 * Deriva estatísticas agregadas do catálogo. Função pura (testável) — recebe
 * os doramas e os `actorAliases` de merge manual para contar atores canônicos
 * (não os ids crus persistidos).
 */
export function computeStats(
  doramas: DoramaRecord[],
  aliases: Record<string, string> = {},
): CatalogStats {
  const actors = actorsByAppearance(doramas, aliases);
  const doramaCount = doramas.length;
  const actorCount = actors.length;
  const appearanceCount = actors.reduce((acc, a) => acc + a.appearances, 0);

  // Protagonistas canônicos únicos (que já foram protagonista em algum dorama).
  const protagonistIds = new Set<string>();
  const map = buildCanonicalIdMap(doramas, aliases);
  for (const d of doramas) {
    for (const m of d.cast) {
      if (m.protagonist) protagonistIds.add(canonicalId(m, map, aliases));
    }
  }

  const topActors = actors.slice(0, TOP_ACTORS_N);

  const yearMap = new Map<number | "—", number>();
  for (const d of doramas) {
    const key = d.year ?? "—";
    yearMap.set(key, (yearMap.get(key) ?? 0) + 1);
  }
  const byYear = [...yearMap.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => {
      if (a.year === "—") return 1;
      if (b.year === "—") return -1;
      return (a.year as number) - (b.year as number);
    });

  return {
    doramaCount,
    actorCount,
    appearanceCount,
    protagonistCount: protagonistIds.size,
    topActors,
    byYear,
  };
}
