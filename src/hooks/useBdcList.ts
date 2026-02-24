'use client';

import useSWR from 'swr';
import { BdcFilter, BdcRow } from '@/types/bdc';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useBdcList(filter: BdcFilter, search: string) {
  const params = new URLSearchParams({ filter });
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: BdcRow[]; count: number }>(
    `/api/bdc?${params}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    bdcList: data?.data || [],
    count: data?.count || 0,
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useBdcResources(bdcId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    bdcId ? `/api/bdc/${bdcId}/resources` : null,
    fetcher
  );

  return {
    resources: data?.data || [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
