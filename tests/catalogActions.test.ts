import { describe, it, expect, beforeEach } from "vitest";
import { useCatalogStore } from "../src/store/catalogStore";
import { useCatalogActions } from "../src/hooks/useCatalogActions";
import type { CastMember, DoramaRecord } from "../src/types/models";

const member = (personId: string): CastMember => ({
  personId,
  name: personId,
  order: 0,
  protagonist: false,
});

const dorama = (id: string, cast: CastMember[]): DoramaRecord => ({
  id,
  title: `D${id}`,
  addedAt: 1,
  cast,
});

describe("useCatalogActions (bridge de persistência)", () => {
  beforeEach(() => {
    useCatalogStore.getState().clearAll();
    localStorage.clear();
  });

  it("updateDorama persiste título/ano no doc v2", () => {
    useCatalogStore.getState().setDoramas([dorama("1", [])]);
    useCatalogActions().updateDorama({ ...dorama("1", []), title: "Novo", year: 2021 });
    const persisted = JSON.parse(localStorage.getItem("dorama_graph_data")!);
    expect(persisted.doramas[0].title).toBe("Novo");
    expect(persisted.doramas[0].year).toBe(2021);
  });

  it("removeActorFromCatalog remove o ator de todos os doramas e persiste", () => {
    useCatalogStore.getState().setDoramas([
      dorama("d1", [member("X"), member("Y")]),
      dorama("d2", [member("X")]),
      dorama("d3", [member("Z")]),
    ]);
    const ok = useCatalogActions().removeActorFromCatalog("X");
    expect(ok).toBe(true);

    const list = useCatalogStore.getState().doramas;
    expect(list.find((d) => d.id === "d1")!.cast.map((m) => m.personId)).toEqual(["Y"]);
    expect(list.find((d) => d.id === "d2")!.cast).toHaveLength(0);
    expect(list.find((d) => d.id === "d3")!.cast.map((m) => m.personId)).toEqual(["Z"]);

    const persisted = JSON.parse(localStorage.getItem("dorama_graph_data")!);
    expect(persisted.doramas.find((d: DoramaRecord) => d.id === "d1").cast).toHaveLength(1);
  });
});
