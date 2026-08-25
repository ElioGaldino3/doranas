import { describe, it, expect, beforeEach } from "vitest";
import { useCatalogStore } from "../src/store/catalogStore";
import type { DoramaRecord } from "../src/types/models";

const dorama = (id: string): DoramaRecord => ({
  id,
  title: `Dorama ${id}`,
  addedAt: Date.now(),
  cast: [],
});

describe("useCatalogStore", () => {
  beforeEach(() => {
    useCatalogStore.setState({ doramas: [], screen: { name: "doramas" } });
  });

  it("addDorama adiciona e não duplica por id", () => {
    const { addDorama } = useCatalogStore.getState();
    addDorama(dorama("1"));
    addDorama(dorama("1"));
    addDorama(dorama("2"));
    expect(useCatalogStore.getState().doramas).toHaveLength(2);
  });

  it("navigate troca a tela", () => {
    const { navigate } = useCatalogStore.getState();
    navigate({ name: "dorama-detail", doramaId: "1" });
    expect(useCatalogStore.getState().screen).toEqual({ name: "dorama-detail", doramaId: "1" });
    navigate({ name: "atores" });
    expect(useCatalogStore.getState().screen).toEqual({ name: "atores" });
  });

  it("setDoramas substitui a lista", () => {
    const { setDoramas } = useCatalogStore.getState();
    setDoramas([dorama("1"), dorama("2")]);
    expect(useCatalogStore.getState().doramas).toHaveLength(2);
  });
});
