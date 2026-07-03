import { AuthProvider } from "./context/AuthContext";
import { Sidebar } from "./components/layout/Sidebar";
import { GraphCanvas } from "./components/layout/GraphCanvas";

export default function App() {
  return (
    <AuthProvider>
      <div className="flex h-screen w-screen bg-gray-950">
        <Sidebar />
        <GraphCanvas />
      </div>
    </AuthProvider>
  );
}
