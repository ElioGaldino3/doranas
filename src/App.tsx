import { AlertTriangle } from "lucide-react";
import { useAppInit } from "./hooks/useAppInit";
import { useAutoRehydrate } from "./hooks/useAutoRehydrate";
import { useCatalogStore } from "./store/catalogStore";
import { InitScreen } from "./components/init/InitScreen";
import { Header } from "./components/layout/Header";
import { DoramasScreen } from "./components/catalog/DoramasScreen";
import { AtoresScreen } from "./components/catalog/AtoresScreen";
import { EstatisticasScreen } from "./components/catalog/EstatisticasScreen";
import { DoramaDetailScreen } from "./components/catalog/DoramaDetailScreen";
import { AtorDetailScreen } from "./components/catalog/AtorDetailScreen";

export default function App() {
  const init = useAppInit();
  const screen = useCatalogStore((s) => s.screen);

  // Re-hidrata em background os doramas pendentes (adds manuais) ao carregar.
  useAutoRehydrate();

  if (init.loading) {
    return <InitScreen progress={init.progress} error={init.error} />;
  }

  return (
    <div className="flex h-dvh w-screen flex-col overflow-hidden bg-gray-950">
      <Header />

      {init.error && (
        <div
          style={{ animation: "fadeIn 0.2s ease-out" }}
          className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-950/30 px-5 py-2.5 text-xs leading-relaxed text-amber-400"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{init.error}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        {screen.name === "doramas" && <DoramasScreen />}
        {screen.name === "atores" && <AtoresScreen />}
        {screen.name === "estatisticas" && <EstatisticasScreen />}
        {screen.name === "dorama-detail" && (
          <DoramaDetailScreen doramaId={screen.doramaId} />
        )}
        {screen.name === "ator-detail" && (
          <AtorDetailScreen personId={screen.personId} />
        )}
      </main>
    </div>
  );
}