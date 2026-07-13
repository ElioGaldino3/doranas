import { useCallback, useRef, useEffect, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { forceCollide } from "d3-force-3d";
import { useGraphStore } from "../../store/graphStore";
import type { Link, Node } from "../../types/graph";

const DORAMA_COLOR = "#f59e0b";
const ACTOR_COLOR = "#64748b";
const DORAMA_HOVER_COLOR = "#fcd34d";
const ACTOR_HOVER_COLOR = "#cbd5e1";
const HIGHLIGHT_GLOW = "rgba(250, 204, 21, 0.3)";
const LINK_COLOR = "rgba(100, 116, 139, 0.3)";
const LINK_HOVER_COLOR = "rgba(148, 163, 184, 0.5)";
const LABEL_COLOR = "#e5e7eb";
const DORAMA_SIZE = 12;
const ACTOR_SIZE = 8;
const CHARGE_STRENGTH = -3000;
const LINK_DISTANCE = 250;
const CENTER_STRENGTH = 0.3;

function collisionRadius(node: Node) {
  const size = node.group === "dorama" ? DORAMA_SIZE : ACTOR_SIZE;
  const labelHeight = 18;
  return size + labelHeight + 4;
}

interface ForceGraphProps {
  onDoramaClick?: (node: Node) => void;
}

export function ForceGraph({ onDoramaClick }: ForceGraphProps) {
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

  useEffect(() => {
    const g = fgRef.current;
    if (!g) return;
    g.d3Force("charge")?.strength(CHARGE_STRENGTH).distanceMax(dimensions.width * 1.5);
    g.d3Force("link")?.distance(LINK_DISTANCE);
    g.d3Force("center")?.strength(CENTER_STRENGTH);
    g.d3Force("collide", forceCollide(collisionRadius).iterations(4));
  }, [fgRef.current, dimensions.width]);

  const graphData = useMemo(() => ({ nodes, links }), [nodes, links]);

  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.label as string;
      const size = node.group === "dorama" ? DORAMA_SIZE : ACTOR_SIZE;
      const isHovered = hoveredNode === node.id;
      const isDimmed =
        hoveredNode !== null &&
        !isHovered &&
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

      if (isHovered && node.group === "dorama") {
        ctx.fillStyle = DORAMA_HOVER_COLOR;
        ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);
      } else if (isHovered && node.group !== "dorama") {
        ctx.fillStyle = ACTOR_HOVER_COLOR;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fill();
      } else if (node.group === "dorama") {
        ctx.fillStyle = isHighlighted ? "#facc15" : DORAMA_COLOR;
        ctx.fillRect(node.x - size, node.y - size, size * 2, size * 2);
      } else {
        ctx.fillStyle = isHighlighted ? "#facc15" : ACTOR_COLOR;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
        ctx.fill();
      }

      const fontSize = Math.max(9, Math.round(11 / globalScale));
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const labelY = node.y + size + 5;
      const labelWidth = ctx.measureText(label).width;
      const bgPad = 3;
      const bgX = node.x - labelWidth / 2 - bgPad;
      const bgY = labelY - 1;
      const bgW = labelWidth + bgPad * 2;
      const bgH = fontSize + 3;

      ctx.fillStyle = "rgba(3, 7, 18, 0.7)";
      ctx.beginPath();
      ctx.roundRect(bgX, bgY, bgW, bgH, 3);
      ctx.fill();

      ctx.fillStyle = isDimmed ? "rgba(229, 231, 235, 0.5)" : LABEL_COLOR;
      ctx.fillText(label, node.x, labelY);

      ctx.globalAlpha = 1;
    },
    [hoveredNode, links, highlightedNodes],
  );

  const handleNodeHover = useCallback(
    (node: any | null) => {
      setHoveredNode(node ? node.id : null);
      if (node) clearHighlights();
    },
    [setHoveredNode, clearHighlights],
  );

  const handleNodeClick = useCallback((node: any) => {
    if (node.group === "dorama") {
      onDoramaClick?.(node as Node);
    } else {
      const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(node.label)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [onDoramaClick]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeCanvasObject={nodeCanvasObject}
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        linkColor={(l: any) => {
          if (hoveredNode) {
            const source = typeof l.source === "object" ? l.source?.id : l.source;
            const target = typeof l.target === "object" ? l.target?.id : l.target;
            if (source === hoveredNode || target === hoveredNode) {
              return LINK_HOVER_COLOR;
            }
          }
          return LINK_COLOR;
        }}
        linkWidth={(l: any) => {
          if (hoveredNode) {
            const source = typeof l.source === "object" ? l.source?.id : l.source;
            const target = typeof l.target === "object" ? l.target?.id : l.target;
            if (source === hoveredNode || target === hoveredNode) {
              return 1.5;
            }
          }
          return 0.5;
        }}
        backgroundColor="#030712"
        width={dimensions.width}
        height={dimensions.height}
        warmupTicks={0}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.35}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}
