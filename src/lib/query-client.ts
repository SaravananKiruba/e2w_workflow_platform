/**
 * React Query Client Configuration
 * 
 * Centralized configuration for React Query with sensible defaults:
 * - 5 minute stale time for lookup data
 * - Automatic retry with exponential backoff
 * - Error handling
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - lookup data doesn't change too frequently
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
    },
    mutations: {
      retry: 1,
    },
  },
});
