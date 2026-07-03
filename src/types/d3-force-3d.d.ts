declare module "d3-force-3d" {
  export interface ForceCollide<NodeDatum> {
    (nodes: NodeDatum[]): { nodes: NodeDatum[]; alpha: number };
    radius(radius: number | ((node: any) => number)): this;
    strength(strength: number): this;
    iterations(iterations: number): this;
  }
  export function forceCollide<NodeDatum>(radius?: number | ((node: any) => number)): ForceCollide<NodeDatum>;
  export function forceSimulation<NodeDatum>(nodes?: NodeDatum[]): any;
  export function forceCenter(x?: number, y?: number, z?: number): any;
  export function forceManyBody<NodeDatum>(): any;
  export function forceLink<NodeDatum, LinkDatum>(): any;
}
