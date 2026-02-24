'use client';

import useSWR from 'swr';
import { SophiaContractRow } from '@/types/sophia';
import { useDebounce } from './useDebounce';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useContractSearch(search: string) {
  const debouncedSearch = useDebounce(search, 300);

  const { data, error, isLoading } = useSWR(
    debouncedSearch.length >= 2
      ? `/api/sophia/contracts?search=${encodeURIComponent(debouncedSearch)}&limit=10`
      : null,
    fetcher
  );

  return {
    contracts: (data?.data || []) as SophiaContractRow[],
    isLoading,
    isError: !!error,
  };
}

export function useOrganizationChildren(orgId: string | null) {
  const { data, error, isLoading } = useSWR(
    orgId ? `/api/sophia/organizations/${orgId}/children` : null,
    fetcher
  );

  return {
    children: data?.data || [],
    isLoading,
    isError: !!error,
  };
}
