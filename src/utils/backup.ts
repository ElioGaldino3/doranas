import { SCHEMA_VERSION } from "../types/models";
import type { DoramaDocument, DoramaRecord } from "../types/models";
import { isV2Doc } from "../services/persistence";

/** Nome padrão do arquivo de backup exportado. */
export const BACKUP_FILENAME = "dorama-actors-backup.json";

const INVALID_BACKUP = "Arquivo de backup inválido ou incompatível.";

/**
 * Serializa o catálogo num DoramaDocument v2 — a mesma forma persistida na
 * chave `dorama_graph_data`, para que o backup seja re-importável e portável.
 */
export function serializeCatalog(doramas: DoramaRecord[]): DoramaDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    doramas,
    updatedAt: Date.now(),
  };
}

/** Verifica se um valor é um DoramaRecord mínimo (defesa contra JSON estranho). */
function isDoramaRecord(value: unknown): value is DoramaRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.title === "string" &&
    Array.isArray(r.cast)
  );
}

/**
 * Faz o parse de um backup JSON (string) em uma lista de DoramaRecord.
 *
 * Aceita tanto um DoramaDocument v2 completo quanto um array cru de doramas
 * (tolerância a formatos futuros), e lança `Error` se o conteúdo for
 * ilegível, com schema incompatível ou estrutura inesperada.
 */
export function parseBackup(raw: string): DoramaRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(INVALID_BACKUP);
  }
  if (isV2Doc(parsed)) return parsed.doramas;
  if (Array.isArray(parsed) && parsed.every(isDoramaRecord)) {
    return parsed as DoramaRecord[];
  }
  throw new Error(INVALID_BACKUP);
}

/**
 * Mescla doramas importados no catálogo existente por TMDB id.
 *
 * Em colisão de id, o registro importado prevalece (última versão vence).
 * Registros existentes que não estão no arquivo são preservados — a operação
 * é não-destrutiva e não muta os inputs (retorna uma nova lista).
 */
export function mergeDoramas(
  existing: DoramaRecord[],
  imported: DoramaRecord[],
): DoramaRecord[] {
  const byId = new Map<string, DoramaRecord>();
  for (const d of existing) byId.set(d.id, d);
  for (const d of imported) byId.set(d.id, d); // importado prevalece

  const seen = new Set(existing.map((d) => d.id));
  const result: DoramaRecord[] = [...existing];
  for (const d of imported) {
    if (!seen.has(d.id)) result.push(d);
  }
  // Aplica a versão prevalecente (importado) em cada id, sem mutar inputs.
  return result.map((d) => byId.get(d.id) ?? d);
}
