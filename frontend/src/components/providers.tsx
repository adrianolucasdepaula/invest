'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { logger } from '@/lib/logger'
import { ErrorBoundary } from '@/components/error-boundary'

/**
 * FASE 76.2 + 76.3: Global Error Handlers + Error Boundaries
 *
 * Centralized error logging for all queries and mutations.
 * Global ErrorBoundary captures React rendering errors.
 * Errors are logged via the frontend logger with full context.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            logger.queryError(query.queryKey, error);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, variables, _context, mutation) => {
            logger.mutationError(mutation.options.mutationKey, error, variables);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error instanceof Error && 'status' in error) {
                const status = (error as { status: number }).status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              // Retry up to 2 times for other errors
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false, // Don't retry mutations by default
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
