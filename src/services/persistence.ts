import { SCHEMA_VERSION } from "../types/models";
import type { DoramaDocument, DoramaRecord } from "../types/models";

export const STORAGE_KEY = "dorama_graph_data";
export const BACKUP_KEY = "dorama_graph_backup_v1";

/** Abstração mínima de storage (permite testes com mock; default = localStorage). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): StorageLike {
  return {
    getItem: (k) => localStorage.getItem(k),
    setItem: (k, v) => localStorage.setItem(k, v),
    removeItem: (k) => localStorage.removeItem(k),
  };
}

/** Formatos v1 (grafo) lidos do storage — a migração ainda precisa deles. */
export interface V1Node {
  id: string;
  label: string;
  group: "dorama" | "actor";
  imgUrl: string;
}

export interface V1Link {
  source: string;
  target: string;
}

/** Formato v1 (grafo) lido do storage. */
export interface V1GraphDocument {
  nodes: V1Node[];
  links: V1Link[];
  updatedAt: number;
}

/** Lê o documento atual da chave, sem interpretar a versão. */
export function readRawDoc(storage: StorageLike = defaultStorage()): unknown | null {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Detecta se o conteúdo é v1 (grafo sem schemaVersion, com nodes[]). */
export function isV1Doc(doc: unknown): doc is V1GraphDocument {
  if (!doc || typeof doc !== "object") return false;
  const d = doc as Record<string, unknown>;
  return !("schemaVersion" in d) && Array.isArray(d.nodes);
}

/** Detecta se o conteúdo é v2 (catálogo com schemaVersion). */
export function isV2Doc(doc: unknown): doc is DoramaDocument {
  if (!doc || typeof doc !== "object") return false;
  const d = doc as Record<string, unknown>;
  return d.schemaVersion === SCHEMA_VERSION && Array.isArray(d.doramas);
}

/** Extrai doramas (ordem e ids TMDB) de um doc v1. */
export function doramasFromV1(doc: V1GraphDocument): { id: string; title: string }[] {
  return doc.nodes
    .filter((n) => n.group === "dorama")
    .map((n) => ({ id: n.id, title: n.label }));
}

/** Cria o backup do doc v1 (preserva para rollback/diagnóstico). */
export function backupV1(
  doc: V1GraphDocument,
  storage: StorageLike = defaultStorage(),
): void {
  try {
    storage.setItem(BACKUP_KEY, JSON.stringify(doc));
  } catch (e) {
    // falha no backup não deve travar a migração; apenas loga
    console.warn("Falha ao criar backup v1", e);
  }
}

/** Lê um doc v2 válido; retorna null se ausente/corrompido. */
export function readV2Doc(storage: StorageLike = defaultStorage()): DoramaDocument | null {
  const doc = readRawDoc(storage);
  return isV2Doc(doc) ? doc : null;
}

/** Persiste o doc v2. Retorna false em falha de storage (ex.: quota). */
export function writeV2Doc(
  doramas: DoramaRecord[],
  extra: Partial<Pick<DoramaDocument, "migrationPending" | "lastError">> = {},
  storage: StorageLike = defaultStorage(),
): boolean {
  try {
    const doc: DoramaDocument = {
      schemaVersion: SCHEMA_VERSION,
      doramas,
      updatedAt: Date.now(),
      ...extra,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(doc));
    return true;
  } catch (e) {
    console.error("Falha ao salvar dorama_graph_data (v2)", e);
    return false;
  }
}

/** Remove a chave (usar com cautela). */
export function clearKey(storage: StorageLike = defaultStorage()): void {
  storage.removeItem(STORAGE_KEY);
}
