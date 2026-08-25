import { describe, it, expect, beforeEach } from "vitest";
import { useGraphStore } from "../src/store/graphStore";

describe("useGraphStore", () => {
  beforeEach(() => {
    useGraphStore.setState({
      nodes: [],
      links: [],
      highlightedNodes: new Set(),
      hoveredNode: null,
    });
  });

  const doramaNode = (id: string) => ({ id, label: `Dorama ${id}`, group: "dorama" as const, imgUrl: "" });
  const actorNode = (id: string) => ({ id, label: `Ator ${id}`, group: "actor" as const, imgUrl: "" });

  it("addDorama mescla nós e arestas sem duplicar", () => {
    const { addDorama } = useGraphStore.getState();
    addDorama([doramaNode("d1"), actorNode("a1")], [{ source: "a1", target: "d1" }]);
    addDorama([doramaNode("d1"), actorNode("a2")], [{ source: "a2", target: "d1" }]);

    const { nodes, links } = useGraphStore.getState();
    expect(nodes).toHaveLength(3); // d1, a1, a2
    expect(links).toHaveLength(2);
  });

  it("addDorama marca atores já existentes como cross-referenced", () => {
    const { addDorama } = useGraphStore.getState();
    addDorama([doramaNode("d1"), actorNode("a1")], [{ source: "a1", target: "d1" }]);
    addDorama([doramaNode("d2"), actorNode("a1")], [{ source: "a1", target: "d2" }]);

    const { highlightedNodes } = useGraphStore.getState();
    expect(highlightedNodes.has("a1")).toBe(true);
  });

  it("removeDorama remove o nó do dorama e atores sem outras arestas", () => {
    const { addDorama, removeDorama } = useGraphStore.getState();
    addDorama([doramaNode("d1"), actorNode("a1"), actorNode("a2")], [
      { source: "a1", target: "d1" },
      { source: "a2", target: "d1" },
    ]);
    removeDorama("d1");

    const { nodes, links } = useGraphStore.getState();
    expect(nodes).toHaveLength(0);
    expect(links).toHaveLength(0);
  });
});
