'use client';

import useSWR from 'swr';
import { BdcFilter, BdcRow } from '@/types/bdc';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
};

export function useBdcList(filter: BdcFilter, search: string, page = 1, pageSize = 50) {
  const params = new URLSearchParams({ filter, page: String(page), pageSize: String(pageSize) });
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    data: BdcRow[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(
    `/api/bdc?${params}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  return {
    bdcList: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 1,
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
