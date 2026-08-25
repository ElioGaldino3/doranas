import type { DoramaRecord } from "../types/models";

/** Critérios de ordenação do catálogo de doramas. */
export type DoramaSort = "recent" | "title" | "year";

/** Colator pt-BR (base, numérico) p/ ordenar títulos com acentos corretamente. */
const COLLATOR = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

/**
 * Ordena uma lista de doramas (retorna nova lista, não muta a entrada).
 * - recent: addedAt desc (mais recentes primeiro)
 * - title:  título A→Z (colação pt-BR, ignore case/acento)
 * - year:   ano asc; doramas sem ano vão para o fim
 */
export function sortDoramas(doramas: DoramaRecord[], sortBy: DoramaSort): DoramaRecord[] {
  const copy = [...doramas];
  switch (sortBy) {
    case "title":
      return copy.sort((a, b) => COLLATOR.compare(a.title, b.title));
    case "year":
      return copy.sort((a, b) => {
        const ay = a.year ?? Number.POSITIVE_INFINITY;
        const by = b.year ?? Number.POSITIVE_INFINITY;
        return ay - by;
      });
    case "recent":
    default:
      return copy.sort((a, b) => b.addedAt - a.addedAt);
  }
}

/**
 * Filtra doramas por substring (case-insensitive) no título. String vazia/space
 * retorna a lista original (sem alocação extra de filtro).
 */
export function filterDoramas(doramas: DoramaRecord[], query: string): DoramaRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return doramas;
  return doramas.filter((d) => d.title.toLowerCase().includes(q));
}
