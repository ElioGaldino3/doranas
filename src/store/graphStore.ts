import { create } from "zustand";
import type { Node, Link } from "../types/graph";

function linkSourceId(link: Link): string {
  return typeof link.source === "object" && link.source !== null
    ? (link.source as any).id ?? String(link.source)
    : link.source;
}

function linkTargetId(link: Link): string {
  return typeof link.target === "object" && link.target !== null
    ? (link.target as any).id ?? String(link.target)
    : link.target;
}

interface GraphState {
  nodes: Node[];
  links: Link[];
  hoveredNode: string | null;
  highlightedNodes: Set<string>;
  setGraph: (nodes: Node[], links: Link[]) => void;
  addDorama: (nodes: Node[], links: Link[]) => void;
  removeDorama: (doramaId: string) => void;
  clearGraphData: () => void;
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

    const existingLinkKeys = new Set(existingLinks.map((l) => `${l.source}-${l.target}`));
    const mergedLinks = [...existingLinks];
    for (const l of newLinks) {
      if (!existingLinkKeys.has(`${l.source}-${l.target}`)) {
        mergedLinks.push(l);
      }
    }

    set({
      nodes: mergedNodes,
      links: mergedLinks,
      highlightedNodes: crossReferenced,
    });
  },

  removeDorama: (doramaId) => {
    const { nodes: existing, links: existingLinks } = get();

    const linksAfter = existingLinks.filter((l) => linkTargetId(l) !== doramaId);

    const nodesAfterDorama = existing.filter((n) => n.id !== doramaId);

    const actorIdsWithLinks = new Set(linksAfter.map(linkSourceId));
    const nodesAfter = nodesAfterDorama.filter(
      (n) => n.group !== "actor" || actorIdsWithLinks.has(n.id),
    );

    set({ nodes: nodesAfter, links: linksAfter });
  },

  clearGraphData: () => set({ nodes: [], links: [], highlightedNodes: new Set() }),

  setHoveredNode: (id) => set({ hoveredNode: id }),

  clearHighlights: () => set({ highlightedNodes: new Set() }),
}));
