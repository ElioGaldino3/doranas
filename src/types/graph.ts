export interface Node {
  id: string;
  label: string;
  group: "dorama" | "actor";
  imgUrl: string;
}

export interface Link {
  source: string;
  target: string;
}

export interface GraphDocument {
  nodes: Node[];
  links: Link[];
  updatedAt: number;
}
