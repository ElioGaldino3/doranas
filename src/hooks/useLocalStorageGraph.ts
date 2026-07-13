import { useEffect, useState } from "react";
import { useGraphStore } from "../store/graphStore";
import type { Node, Link, GraphDocument } from "../types/graph";

const STORAGE_KEY = "dorama_graph_data";

function sanitizeLinks(links: Link[]): Link[] {
  return links.map((link) => ({
    ...link,
    source: typeof link.source === "object" && link.source !== null
      ? (link.source as any).id ?? String(link.source)
      : link.source,
    target: typeof link.target === "object" && link.target !== null
      ? (link.target as any).id ?? String(link.target)
      : link.target,
  }));
}

function cleanNodes(nodes: Node[]): Node[] {
  return nodes.map((node) => {
    const cleaned = { ...node } as any;
    delete cleaned.x;
    delete cleaned.y;
    delete cleaned.vx;
    delete cleaned.vy;
    delete cleaned.index;
    return cleaned as Node;
  });
}

function loadFromStorage(): GraphDocument {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { nodes: [], links: [], updatedAt: 0 };
    const parsed: GraphDocument = JSON.parse(raw);
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.links)) {
      console.warn("Invalid graph data in localStorage, resetting");
      localStorage.removeItem(STORAGE_KEY);
      return { nodes: [], links: [], updatedAt: 0 };
    }
    return {
      nodes: cleanNodes(parsed.nodes),
      links: sanitizeLinks(parsed.links),
      updatedAt: parsed.updatedAt,
    };
  } catch (e) {
    console.warn("Failed to parse graph data from localStorage", e);
    localStorage.removeItem(STORAGE_KEY);
    return { nodes: [], links: [], updatedAt: 0 };
  }
}

function saveToStorage(nodes: Node[], links: Link[]): boolean {
  try {
    const doc: GraphDocument = {
      nodes: cleanNodes(nodes),
      links: sanitizeLinks(links),
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    return true;
  } catch (e) {
    console.error("Failed to save graph data to localStorage", e);
    return false;
  }
}

export function useLocalStorageGraph() {
  const {
    nodes,
    links,
    setGraph,
    addDorama: storeAdd,
    highlightedNodes,
    clearHighlights,
  } = useGraphStore();
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const data = loadFromStorage();
    setGraph(data.nodes, data.links);
  }, [setGraph]);

  const addDorama = (newNodes: Node[], newLinks: Link[]) => {
    storeAdd(newNodes, newLinks);
    const current = useGraphStore.getState();
    const ok = saveToStorage(current.nodes, current.links);
    if (!ok) {
      setStorageError("Could not save data. localStorage may be full.");
      setTimeout(() => setStorageError(null), 5000);
    }
    return current.highlightedNodes.size;
  };

  const removeDorama = (doramaId: string) => {
    useGraphStore.getState().removeDorama(doramaId);
    const current = useGraphStore.getState();
    saveToStorage(current.nodes, current.links);
  };

  const clearGraphData = () => {
    localStorage.removeItem(STORAGE_KEY);
    useGraphStore.getState().clearGraphData();
  };

  return {
    nodes,
    links,
    highlightedNodes,
    addDorama,
    removeDorama,
    clearGraphData,
    clearHighlights,
    isEmpty: nodes.length === 0,
    storageError,
  };
}
