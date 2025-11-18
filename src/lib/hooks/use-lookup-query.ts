/**
 * React Query Hooks for Lookup Data
 * 
 * These hooks provide:
 * - Automatic caching and deduplication
 * - Auto-refresh when data is invalidated
 * - Loading and error states
 * - Type-safe API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
export interface LookupOption {
  value: string;
  label: string;
  record?: Record<string, any>;
}

interface LookupParams {
  tenantId: string;
  targetModule: string;
  displayField?: string;
  searchFields?: string[];
  searchTerm?: string;
}

// Query Keys - centralized for easy invalidation
export const lookupKeys = {
  all: ['lookups'] as const,
  module: (tenantId: string, moduleName: string) => 
    ['lookups', tenantId, moduleName] as const,
  moduleWithSearch: (tenantId: string, moduleName: string, searchTerm?: string) => 
    ['lookups', tenantId, moduleName, searchTerm] as const,
};

/**
 * Fetch lookup options from API
 */
async function fetchLookupOptions(params: LookupParams): Promise<LookupOption[]> {
  const { tenantId, targetModule, displayField, searchFields, searchTerm } = params;
  
  const queryParams = new URLSearchParams({
    tenantId,
    targetModule,
  });

  if (displayField) queryParams.append('displayField', displayField);
  if (searchFields?.length) queryParams.append('searchFields', searchFields.join(','));
  if (searchTerm) queryParams.append('searchTerm', searchTerm);

  const response = await fetch(`/api/metadata/lookup?${queryParams}`, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch lookup options: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hook to fetch lookup options with caching and auto-refresh
 * 
 * Usage:
 * const { data: options, isLoading, error } = useLookupOptions({
 *   tenantId,
 *   targetModule: 'Clients',
 *   displayField: 'clientName'
 * });
 */
export function useLookupOptions(params: LookupParams | null) {
  return useQuery({
    queryKey: params 
      ? lookupKeys.moduleWithSearch(params.tenantId, params.targetModule, params.searchTerm)
      : ['lookups', 'disabled'],
    queryFn: () => params ? fetchLookupOptions(params) : Promise.resolve([]),
    enabled: !!params?.tenantId && !!params?.targetModule,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to invalidate (refresh) lookup cache
 * 
 * Usage after create/update:
 * const invalidateLookups = useInvalidateLookups();
 * await createRecord(data);
 * invalidateLookups('Clients'); // Refresh all Client dropdowns
 */
export function useInvalidateLookups() {
  const queryClient = useQueryClient();

  return (moduleName?: string, tenantId?: string) => {
    if (moduleName && tenantId) {
      // Invalidate specific module
      queryClient.invalidateQueries({
        queryKey: lookupKeys.module(tenantId, moduleName),
      });
    } else {
      // Invalidate all lookups
      queryClient.invalidateQueries({
        queryKey: lookupKeys.all,
      });
    }
  };
}

/**
 * Hook to manually update lookup cache (optimistic updates)
 * 
 * Usage:
 * const updateLookupCache = useUpdateLookupCache();
 * updateLookupCache('Clients', tenantId, newClient);
 */
export function useUpdateLookupCache() {
  const queryClient = useQueryClient();

  return (moduleName: string, tenantId: string, newRecord: any, displayField: string = 'name') => {
    const queryKey = lookupKeys.module(tenantId, moduleName);
    
    queryClient.setQueriesData(
      { queryKey },
      (old: LookupOption[] | undefined) => {
        if (!old) return old;
        
        const newOption: LookupOption = {
          value: newRecord.id,
          label: newRecord[displayField] || newRecord.name || 'New Record',
          record: newRecord,
        };

        // Check if record already exists (update case)
        const existingIndex = old.findIndex(opt => opt.value === newRecord.id);
        if (existingIndex >= 0) {
          const updated = [...old];
          updated[existingIndex] = newOption;
          return updated;
        }

        // Add new record to beginning
        return [newOption, ...old];
      }
    );
  };
}
