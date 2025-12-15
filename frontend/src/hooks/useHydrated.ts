'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect client-side hydration
 *
 * Use this hook to avoid hydration mismatches in Next.js
 * when rendering content that depends on client-side state.
 *
 * @returns {boolean} true after the component has mounted on the client
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
