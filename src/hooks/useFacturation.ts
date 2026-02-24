'use client';

import useSWR from 'swr';
import { FacturationTab, FacturationFilter, ResourceRow } from '@/types/resource';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useFacturation(tab: FacturationTab, filter: FacturationFilter, search: string) {
  const params = new URLSearchParams({ tab, filter });
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: ResourceRow[]; count: number }>(
    `/api/bdc/facturation?${params}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    resources: data?.data || [],
    count: data?.count || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useCancelledBdcIds() {
  const { data } = useSWR<{ success: boolean; data: string[] }>(
    '/api/bdc/facturation/cancelled',
    fetcher,
    { refreshInterval: 60000 }
  );

  return new Set(data?.data || []);
}
