import { useEffect } from "react";
import { useGraphStore } from "../store/graphStore";
import { loadGraph, saveGraph } from "../services/firestore";
import { useAuth } from "./useAuth";

export function useGraph() {
  const { user } = useAuth();
  const { nodes, links, setGraph, addDorama: storeAdd } = useGraphStore();

  useEffect(() => {
    if (!user) {
      setGraph([], []);
      return;
    }
    loadGraph(user.uid).then((data) => {
      if (data) {
        setGraph(data.nodes, data.links);
      }
    });
  }, [user, setGraph]);

  const addDorama = async (
    newNodes: typeof nodes,
    newLinks: typeof links,
  ) => {
    storeAdd(newNodes, newLinks);
    if (user) {
      const current = useGraphStore.getState();
      await saveGraph(user.uid, current.nodes, current.links);
    }
  };

  return { nodes, links, addDorama };
}
