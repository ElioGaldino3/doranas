import { LoginButton } from "../auth/LoginButton";
import { SearchInput } from "../search/SearchInput";
import { useAuth } from "../../hooks/useAuth";

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="flex w-72 flex-col gap-6 border-r border-gray-800 bg-gray-950 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-gray-100">
          Dorama Actors
        </h1>
      </div>

      <LoginButton />

      {user && (
        <>
          <div className="border-t border-gray-800 pt-4">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
              Add Dorama
            </h2>
            <SearchInput />
          </div>
        </>
      )}
    </aside>
  );
}
