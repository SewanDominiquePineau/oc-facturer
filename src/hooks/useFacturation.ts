'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import { FacturationTab, FacturationFilter, ResourceRow } from '@/types/resource';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

export function useFacturation(tab: FacturationTab, filter: FacturationFilter, search: string, page = 1, pageSize = 50) {
  const params = new URLSearchParams({ tab, filter, page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: ResourceRow[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(
    `/api/bdc/facturation?${params}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    resources: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 1,
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

  return useMemo(() => new Set(data?.data || []), [data?.data]);
}
