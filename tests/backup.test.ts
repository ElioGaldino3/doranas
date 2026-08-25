import { describe, it, expect, beforeEach } from "vitest";
import {
  serializeCatalog,
  parseBackup,
  mergeDoramas,
  BACKUP_FILENAME,
} from "../src/utils/backup";
import { useCatalogStore } from "../src/store/catalogStore";
import { useCatalogActions } from "../src/hooks/useCatalogActions";
import { SCHEMA_VERSION } from "../src/types/models";
import type { DoramaRecord } from "../src/types/models";

function dorama(id: string, title: string, castCount = 1): DoramaRecord {
  return {
    id,
    title,
    addedAt: 1,
    cast: Array.from({ length: castCount }, (_, i) => ({
      personId: `${id}-p${i}`,
      name: `Actor ${i}`,
      order: i,
      protagonist: i < 3,
    })),
  };
}

describe("serializeCatalog", () => {
  it("produz um DoramaDocument v2 com os doramas e updatedAt numérico", () => {
    const list = [dorama("1", "A"), dorama("2", "B")];
    const doc = serializeCatalog(list);
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.doramas).toEqual(list);
    expect(typeof doc.updatedAt).toBe("number");
  });

  it("inclui actorAliases quando houver", () => {
    const doc = serializeCatalog([dorama("1", "A")], { "123": "456" });
    expect(doc.actorAliases).toEqual({ "123": "456" });
  });

  it("omite actorAliases vazio", () => {
    const doc = serializeCatalog([dorama("1", "A")], {});
    expect(doc.actorAliases).toBeUndefined();
  });
});

describe("parseBackup", () => {
  it("aceita um DoramaDocument v2 serializado (retorna ParsedBackup)", () => {
    const list = [dorama("1", "A")];
    const raw = JSON.stringify({ schemaVersion: SCHEMA_VERSION, doramas: list, updatedAt: 123 });
    expect(parseBackup(raw)).toEqual({ doramas: list });
  });

  it("preserva actorAliases do doc v2", () => {
    const list = [dorama("1", "A")];
    const raw = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      doramas: list,
      actorAliases: { "123": "456" },
      updatedAt: 123,
    });
    expect(parseBackup(raw)).toEqual({ doramas: list, actorAliases: { "123": "456" } });
  });

  it("aceita um array cru de doramas (sem aliases)", () => {
    const list = [dorama("1", "A")];
    expect(parseBackup(JSON.stringify(list))).toEqual({ doramas: list });
  });

  it("lança em JSON inválido", () => {
    expect(() => parseBackup("not json")).toThrow();
  });

  it("lança em schema incompatível (objeto sem doramas)", () => {
    expect(() => parseBackup(JSON.stringify({ foo: 1 }))).toThrow();
  });

  it("lança quando o array contém entrada sem id/título", () => {
    expect(() => parseBackup(JSON.stringify([{ title: "x" }]))).toThrow();
  });
});

describe("mergeDoramas", () => {
  it("preserva existentes ausentes no import e anexa novos", () => {
    const existing = [dorama("1", "A"), dorama("2", "B")];
    const imported = [dorama("3", "C")];
    const merged = mergeDoramas(existing, imported);
    expect(merged.map((d) => d.id)).toEqual(["1", "2", "3"]);
  });

  it("o importado prevalece em colisão de id", () => {
    const existing = [dorama("1", "Antigo")];
    const imported = [dorama("1", "Novo")];
    const merged = mergeDoramas(existing, imported);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("Novo");
  });

  it("não muta os arrays de entrada", () => {
    const existing = [dorama("1", "A")];
    const imported = [dorama("2", "B")];
    const existingCopy = [...existing];
    const importedCopy = [...imported];
    mergeDoramas(existing, imported);
    expect(existing).toEqual(existingCopy);
    expect(imported).toEqual(importedCopy);
  });
});

describe("useCatalogActions.importDoramas", () => {
  beforeEach(() => {
    useCatalogStore.getState().clearAll();
    localStorage.clear();
  });

  it("mescla no store, persiste na chave e retorna true", () => {
    useCatalogStore.getState().setDoramas([dorama("1", "A")]);
    const before = useCatalogStore.getState().doramas;
    expect(before).toHaveLength(1);

    const ok = useCatalogActions().importDoramas({ doramas: [dorama("2", "B")] });
    expect(ok).toBe(true);

    const after = useCatalogStore.getState().doramas;
    expect(after.map((d) => d.id)).toEqual(["1", "2"]);

    const persisted = JSON.parse(localStorage.getItem("dorama_graph_data")!);
    expect(persisted.doramas.map((d: DoramaRecord) => d.id)).toEqual(["1", "2"]);
  });

  it("funde os actorAliases do backup com os existentes", () => {
    useCatalogStore.getState().setActorAliases({ "1": "a" });
    useCatalogActions().importDoramas({ doramas: [dorama("2", "B")], actorAliases: { "3": "c" } });
    const persisted = JSON.parse(localStorage.getItem("dorama_graph_data")!);
    expect(persisted.actorAliases).toEqual({ "1": "a", "3": "c" });
  });

  it("mergeActorAlias persiste o alias no doc v2", () => {
    const ok = useCatalogActions().mergeActorAlias("123", "Q678");
    expect(ok).toBe(true);
    expect(useCatalogStore.getState().actorAliases).toEqual({ "123": "Q678" });
    const persisted = JSON.parse(localStorage.getItem("dorama_graph_data")!);
    expect(persisted.actorAliases).toEqual({ "123": "Q678" });
  });

  it("mergeActorAlias ignora source === target", () => {
    const before = useCatalogStore.getState().actorAliases;
    useCatalogActions().mergeActorAlias("x", "x");
    expect(useCatalogStore.getState().actorAliases).toBe(before);
  });
});

describe("BACKUP_FILENAME", () => {
  it("tem extensão .json", () => {
    expect(BACKUP_FILENAME.endsWith(".json")).toBe(true);
  });
});
