import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "node_modules",
      "coverage",
      // Código legado do modelo de grafo — será removido/reescrito na Fase 4
      // (redesign sem gráficos). Evita retrabalho em código descartado.
      "src/components/graph/**",
      "src/components/drawer/**",
      "src/types/d3-force-3d.d.ts",
      "src/types/graph.ts",
      "src/store/graphStore.ts",
      "src/hooks/useLocalStorageGraph.ts",
      "src/hooks/useGraph.ts",
      "src/utils/graphTransform.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
);
