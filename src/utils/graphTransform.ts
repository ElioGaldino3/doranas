import type { Node, Link } from "../types/graph";
import type { SearchResult, CastResult } from "../types/tmdb";
import { imageUrl } from "../services/tmdb";

export function searchResultToNode(s: SearchResult): Node {
  return {
    id: String(s.id),
    label: s.name,
    group: "dorama",
    imgUrl: imageUrl(s.poster_path),
  };
}

export function castResultToNodes(cast: CastResult[]): Node[] {
  return cast.map((c) => ({
    id: String(c.id),
    label: c.name,
    group: "actor" as const,
    imgUrl: imageUrl(c.profile_path),
  }));
}

export function buildLinks(
  doramaId: string,
  actorNodes: Node[],
): Link[] {
  return actorNodes.map((a) => ({
    source: a.id,
    target: doramaId,
  }));
}

export function transformDorama(
  searchResult: SearchResult,
  cast: CastResult[],
): { nodes: Node[]; links: Link[] } {
  const doramaNode = searchResultToNode(searchResult);
  const actorNodes = castResultToNodes(cast);
  const links = buildLinks(doramaNode.id, actorNodes);
  return {
    nodes: [doramaNode, ...actorNodes],
    links,
  };
}
