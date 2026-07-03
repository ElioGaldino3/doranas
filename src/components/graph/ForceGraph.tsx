import { useCallback, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useGraphStore } from "../../store/graphStore";
import type { Link } from "../../types/graph";

export function ForceGraph() {
  const { nodes, links, hoveredNode, highlightedNodes, setHoveredNode } =
    useGraphStore();
  const fgRef = useRef<any>(null);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.label as string;
      const size = node.group === "dorama" ? 8 : 6;
      const isDimmed =
        hoveredNode !== null &&
        node.id !== hoveredNode &&
        !links.some(
          (l: Link) =>
            (l.source === hoveredNode ||
              (l.source as any)?.id === hoveredNode) &&
            (l.target === node.id || (l.target as any)?.id === node.id),
        );

      const isHighlighted = highlightedNodes.has(node.id);

      ctx.globalAlpha = isDimmed ? 0.2 : 1;

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(250, 204, 21, 0.3)";
        ctx.fill();
      }

      if (node.group === "dorama") {
        ctx.fillStyle = isHighlighted ? "#facc15" : "#3b82f6";
        ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);
      } else {
        ctx.fillStyle = isHighlighted ? "#facc15" : "#9ca3af";
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (globalScale > 1.5) {
        ctx.fillStyle = "#e5e7eb";
        ctx.font = "6px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, node.x, node.y + size + 8);
      }

      ctx.globalAlpha = 1;
    },
    [hoveredNode, links, highlightedNodes],
  );

  const handleNodeHover = useCallback(
    (node: any | null) => {
      setHoveredNode(node ? node.id : null);
    },
    [setHoveredNode],
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-600">
        <p className="text-lg">
          Your graph is empty. Search and add a Dorama to get started.
        </p>
      </div>
    );
  }

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={{ nodes, links }}
      nodeCanvasObject={nodeCanvasObject}
      onNodeHover={handleNodeHover}
      linkColor={() => "rgba(75, 85, 99, 0.4)"}
      backgroundColor="#111111"
      width={800}
      height={600}
    />
  );
}
