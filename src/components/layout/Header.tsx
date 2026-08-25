import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, Clapperboard, Film, Moon, Sun, Users } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { SearchInput } from "../search/SearchInput";

/** Alterna o tema claro/escuro e persiste a escolha em localStorage. */
function useTheme() {
  const [isLight, setIsLight] = useState(() =>
    document.documentElement.classList.contains("light"),
  );
  useEffect(() => {
    document.documentElement.classList.toggle("light", isLight);
    try {
      localStorage.setItem("theme", isLight ? "light" : "dark");
    } catch {
      /* ignore */
    }
  }, [isLight]);
  return { isLight, toggle: () => setIsLight((v) => !v) };
}

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
  const { isLight, toggle } = useTheme();

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

        <button
          onClick={toggle}
          aria-label={isLight ? "Alternar para o tema escuro" : "Alternar para o tema claro"}
          aria-pressed={isLight}
          title={isLight ? "Tema escuro" : "Tema claro"}
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-gray-400 transition-all duration-200 hover:border-amber-500/30 hover:text-amber-400"
        >
          {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <SearchInput />
      </div>
    </header>
  );
}