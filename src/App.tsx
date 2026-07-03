import { useState } from "react";
import { Sidebar } from "./components/layout/Sidebar";
import { GraphCanvas } from "./components/layout/GraphCanvas";
import { Menu, X } from "lucide-react";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-gray-950">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-3 top-3 z-50 flex items-center justify-center rounded-xl border border-white/10 bg-black/60 p-2.5 text-gray-400 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-gray-200 lg:hidden"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 lg:static lg:z-auto ${
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0 lg:visible lg:opacity-100"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
        <aside
          className={`relative h-full w-72 overflow-y-auto border-r border-white/[0.06] bg-gray-950/95 backdrop-blur-xl transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>
      </div>

      <GraphCanvas />
    </div>
  );
}
