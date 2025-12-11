import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    // Relax stricter react-hooks v7 rules to maintain stability
    // These rules were added in eslint-plugin-react-hooks v7 and flag
    // legitimate patterns used in this codebase
    rules: {
      // Allow setState in useEffect - common pattern for hydration checks
      // and data fetching. These patterns are intentional and performant.
      'react-hooks/set-state-in-effect': 'off',

      // Allow component definitions inside render - in some cases these
      // are intentional for scope isolation (like SortIcon with props)
      'react-hooks/static-components': 'off',

      // Allow manual memoization with intentionally different deps than inferred
      // Example: portfolio/page.tsx uses [portfolio?.positions, assetMap] instead of [portfolio]
      // This is an intentional optimization to avoid re-renders on unrelated property changes
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**'],
  },
];

export default eslintConfig;
