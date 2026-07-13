import { ChevronRight, Trash2, X } from "lucide-react";
import type { Link, Node } from "../../types/graph";

interface DoramaDetailsDrawerProps {
  doramaNode: Node;
  allNodes: Node[];
  allLinks: Link[];
  onClose: () => void;
  onRemoveDorama: (doramaId: string) => void;
}

interface ActorCrossRef {
  actorNode: Node;
  otherDoramas: Node[];
}

function getLinkId(ref: string | any): string {
  return typeof ref === "object" && ref !== null ? ref.id : ref;
}

function computeCrossReferences(
  doramaNode: Node,
  allNodes: Node[],
  allLinks: Link[],
): ActorCrossRef[] {
  const doramaId = doramaNode.id;

  const currentDoramaLinks = allLinks.filter(
    (l) => getLinkId(l.target) === doramaId,
  );

  const actorIds = currentDoramaLinks.map((l) => getLinkId(l.source));

  const nodesById = new Map(allNodes.map((n) => [n.id, n]));

  const result: ActorCrossRef[] = [];

  for (const actorId of actorIds) {
    const allActorLinks = allLinks.filter(
      (l) => getLinkId(l.source) === actorId,
    );

    if (allActorLinks.length <= 1) continue;

    const otherDoramas = allActorLinks
      .filter((l) => getLinkId(l.target) !== doramaId)
      .map((l) => nodesById.get(getLinkId(l.target)))
      .filter((n): n is Node => n !== undefined && n.group === "dorama");

    const actorNode = nodesById.get(actorId);
    if (actorNode) {
      result.push({ actorNode, otherDoramas });
    }
  }

  return result;
}

function actorImgSrc(node: Node): string | null {
  if (!node.imgUrl) return null;
  if (node.imgUrl.startsWith("http")) {
    return node.imgUrl.replace("/w500/", "/w200/");
  }
  return `https://image.tmdb.org/t/p/w200${node.imgUrl}`;
}

export function DoramaDetailsDrawer({
  doramaNode,
  allNodes,
  allLinks,
  onClose,
  onRemoveDorama,
}: DoramaDetailsDrawerProps) {
  const crossRefs = computeCrossReferences(doramaNode, allNodes, allLinks);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-white/[0.06] bg-gray-950/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
        style={{ animation: "slideIn 0.3s ease-out" }}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-lg font-bold tracking-tight text-white">
            {doramaNode.label}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] p-1.5 text-gray-500 transition-all hover:bg-white/10 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
            Atores já assistidos
          </h3>

          {crossRefs.length === 0 ? (
            <p className="text-sm text-gray-600">
              Nenhum ator em comum com outros doramas no seu gráfico.
            </p>
          ) : (
            <div className="space-y-3">
              {crossRefs.map(({ actorNode, otherDoramas }) => {
                const imgSrc = actorImgSrc(actorNode);
                return (
                  <div
                    key={actorNode.id}
                    className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.06]"
                  >
                    <div className="shrink-0">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={actorNode.label}
                          className="h-82 w-50 rounded-xl border border-white/[0.06] object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02]">
                          <span className="text-lg font-bold text-gray-600">
                            {actorNode.label.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-100">
                        {actorNode.label}
                      </p>

                      {otherDoramas.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {otherDoramas.map((d) => (
                            <li
                              key={d.id}
                              className="flex items-start gap-2 text-xs text-gray-400"
                            >
                              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-500/60" />
                              <span>{d.label}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <button
            onClick={() => {
              onRemoveDorama(doramaNode.id);
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-950/50 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Remover Dorama
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
