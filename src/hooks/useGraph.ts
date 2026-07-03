import { useLocalStorageGraph } from "./useLocalStorageGraph";
import type { Node, Link } from "../types/graph";

export function useGraph() {
  const { nodes, links, addDorama } = useLocalStorageGraph();
  return { nodes, links, addDorama: addDorama as (newNodes: Node[], newLinks: Link[]) => void };
}
