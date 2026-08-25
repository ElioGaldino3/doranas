import { describe, it, expect } from "vitest";
import {
  isV1Doc,
  isV2Doc,
  doramasFromV1,
  backupV1,
  readV2Doc,
  writeV2Doc,
  clearKey,
  STORAGE_KEY,
  BACKUP_KEY,
  type StorageLike,
} from "../src/services/persistence";
import { SCHEMA_VERSION } from "../src/types/models";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const v1Doc = {
  nodes: [
    { id: "1", label: "D1", group: "dorama", imgUrl: "" },
    { id: "a1", label: "Ator", group: "actor", imgUrl: "" },
  ],
  links: [],
  updatedAt: 123,
};

describe("isV1Doc", () => {
  it("reconhece doc v1 (sem schemaVersion, com nodes)", () => {
    expect(isV1Doc(v1Doc)).toBe(true);
  });
  it("rejeita doc v2, null e não-objeto", () => {
    expect(isV1Doc({ schemaVersion: 2, doramas: [], updatedAt: 0 })).toBe(false);
    expect(isV1Doc(null)).toBe(false);
    expect(isV1Doc("x")).toBe(false);
  });
});

describe("isV2Doc / readV2Doc / writeV2Doc", () => {
  it("writeV2Doc persiste e readV2Doc recupera", () => {
    const s = memoryStorage();
    const doramas = [{ id: "1", title: "D1", addedAt: 1, cast: [] }];
    expect(writeV2Doc(doramas, {}, s)).toBe(true);
    const doc = readV2Doc(s);
    expect(doc?.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc?.doramas).toHaveLength(1);
    expect(isV2Doc(doc)).toBe(true);
  });
  it("readV2Doc retorna null quando a chave não é v2", () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, JSON.stringify(v1Doc));
    expect(readV2Doc(s)).toBeNull();
  });
});

describe("doramasFromV1", () => {
  it("extrai só nós dorama com id e label", () => {
    const list = doramasFromV1(v1Doc as never);
    expect(list).toEqual([{ id: "1", title: "D1" }]);
  });
});

describe("backupV1 / clearKey", () => {
  it("backupV1 grava a chave de backup", () => {
    const s = memoryStorage();
    backupV1(v1Doc as never, s);
    expect(s.getItem(BACKUP_KEY)).toBeTruthy();
    expect(JSON.parse(s.getItem(BACKUP_KEY)!)).toEqual(v1Doc);
  });
  it("clearKey remove a chave principal", () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, "x");
    clearKey(s);
    expect(s.getItem(STORAGE_KEY)).toBeNull();
  });
});
