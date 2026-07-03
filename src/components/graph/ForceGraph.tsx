import { useCallback, useRef, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useGraphStore } from "../../store/graphStore";
import type { Link } from "../../types/graph";

const DORAMA_COLOR = "#f59e0b";
const ACTOR_COLOR = "#64748b";
const HIGHLIGHT_GLOW = "rgba(250, 204, 21, 0.3)";
const LINK_COLOR = "rgba(100, 116, 139, 0.3)";
const LABEL_COLOR = "#e5e7eb";

export function ForceGraph() {
  const { nodes, links, hoveredNode, highlightedNodes, setHoveredNode, clearHighlights } =
    useGraphStore();
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (highlightedNodes.size === 0) return;
    const timer = setTimeout(clearHighlights, 5000);
    return () => clearTimeout(timer);
  }, [highlightedNodes, clearHighlights]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.label as string;
      const size = node.group === "dorama" ? 10 : 7;
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
      ctx.globalAlpha = isDimmed ? 0.15 : 1;

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI);
        ctx.fillStyle = HIGHLIGHT_GLOW;
        ctx.fill();
      }

      if (node.group === "dorama") {
        ctx.fillStyle = isHighlighted ? "#facc15" : DORAMA_COLOR;
        ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);
      } else {
        ctx.fillStyle = isHighlighted ? "#facc15" : ACTOR_COLOR;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (globalScale > 1.2) {
        ctx.fillStyle = LABEL_COLOR;
        ctx.font = "7px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(label, node.x, node.y + size + 4);
      }

      ctx.globalAlpha = 1;
    },
    [hoveredNode, links, highlightedNodes],
  );

  const handleNodeHover = useCallback(
    (node: any | null) => {
      if (node) {
        setHoveredNode(node.id);
        clearHighlights();
      } else {
        setHoveredNode(null);
      }
    },
    [setHoveredNode, clearHighlights],
  );

  const handleNodeClick = useCallback((node: any) => {
    if (node.group !== "actor") return;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(node.label)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links }}
        nodeCanvasObject={nodeCanvasObject}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        linkColor={() => LINK_COLOR}
        backgroundColor="#030712"
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}
