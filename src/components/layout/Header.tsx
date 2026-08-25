import type { ReactNode } from "react";
import { BarChart3, Clapperboard, Film, Users } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { SearchInput } from "../search/SearchInput";

function Tab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-amber-500/30 bg-amber-950/30 text-amber-400"
          : "border-transparent text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Barra superior: logo + navegação (Doramas/Atores) + busca global. */
export function Header() {
  const screen = useCatalogStore((s) => s.screen);
  const navigate = useCatalogStore((s) => s.navigate);

  const isDoramasActive = screen.name === "doramas" || screen.name === "dorama-detail";
  const isAtoresActive = screen.name === "atores" || screen.name === "ator-detail";
  const isStatsActive = screen.name === "estatisticas";

  return (
    <header className="flex flex-col gap-3 border-b border-white/[0.06] bg-gray-950/80 px-4 pt-3 backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-3">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate({ name: "doramas" })}
          className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-white"
        >
          <Clapperboard className="h-5 w-5 text-amber-400" />
          <span>
            Dorama<span className="text-amber-400">Actors</span>
          </span>
        </button>

        <nav className="flex items-center gap-1 sm:ml-2">
          <Tab
            active={isDoramasActive}
            onClick={() => navigate({ name: "doramas" })}
            icon={<Film className="h-4 w-4" />}
            label="Doramas"
          />
          <Tab
            active={isAtoresActive}
            onClick={() => navigate({ name: "atores" })}
            icon={<Users className="h-4 w-4" />}
            label="Atores"
          />
          <Tab
            active={isStatsActive}
            onClick={() => navigate({ name: "estatisticas" })}
            icon={<BarChart3 className="h-4 w-4" />}
            label="Estatísticas"
          />
        </nav>
      </div>

      <div className="min-w-0 flex-1">
        <SearchInput />
      </div>
    </header>
  );
}