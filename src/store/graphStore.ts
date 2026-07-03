import { create } from "zustand";
import type { Node, Link } from "../types/graph";

interface GraphState {
  nodes: Node[];
  links: Link[];
  hoveredNode: string | null;
  highlightedNodes: Set<string>;
  setGraph: (nodes: Node[], links: Link[]) => void;
  addDorama: (nodes: Node[], links: Link[]) => void;
  setHoveredNode: (id: string | null) => void;
  clearHighlights: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  links: [],
  hoveredNode: null,
  highlightedNodes: new Set(),

  setGraph: (nodes, links) => set({ nodes, links }),

  addDorama: (newNodes, newLinks) => {
    const { nodes: existing, links: existingLinks } = get();
    const existingIds = new Set(existing.map((n) => n.id));

    const existingActorIds = new Set(
      existing.filter((n) => n.group === "actor").map((n) => n.id),
    );

    const crossReferenced = new Set<string>();
    for (const n of newNodes) {
      if (n.group === "actor" && existingActorIds.has(n.id)) {
        crossReferenced.add(n.id);
      }
    }

    const mergedNodes = [...existing];
    for (const n of newNodes) {
      if (!existingIds.has(n.id)) {
        mergedNodes.push(n);
      }
    }

    const linkKey = (l: Link) => `${l.source}-${l.target}`;
    const existingLinkKeys = new Set(existingLinks.map(linkKey));
    const mergedLinks = [...existingLinks];
    for (const l of newLinks) {
      if (!existingLinkKeys.has(linkKey(l))) {
        mergedLinks.push(l);
      }
    }

    set({
      nodes: mergedNodes,
      links: mergedLinks,
      highlightedNodes: crossReferenced,
    });
  },

  setHoveredNode: (id) => set({ hoveredNode: id }),

  clearHighlights: () => set({ highlightedNodes: new Set() }),
}));
