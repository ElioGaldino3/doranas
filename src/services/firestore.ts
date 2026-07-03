import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { GraphDocument, Node, Link } from "../types/graph";

function graphDoc(uid: string) {
  return doc(db, "users", uid, "graphData");
}

export async function loadGraph(uid: string): Promise<{ nodes: Node[]; links: Link[] } | null> {
  const snap = await getDoc(graphDoc(uid));
  if (!snap.exists()) return null;
  const data = snap.data() as GraphDocument;
  return { nodes: data.nodes, links: data.links };
}

export async function saveGraph(uid: string, nodes: Node[], links: Link[]) {
  await setDoc(graphDoc(uid), {
    nodes,
    links,
    updatedAt: serverTimestamp(),
  });
}
