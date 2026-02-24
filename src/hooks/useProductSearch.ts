'use client';

import useSWR from 'swr';
import { SophiaProductRow } from '@/types/sophia';
import { useDebounce } from './useDebounce';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useProductSearch(code: string) {
  const debouncedCode = useDebounce(code, 300);

  const { data, error, isLoading } = useSWR(
    debouncedCode.length >= 2
      ? `/api/sophia/products/search/${encodeURIComponent(debouncedCode)}`
      : null,
    fetcher
  );

  return {
    products: (data?.data || []) as SophiaProductRow[],
    count: data?.count || 0,
    originalCode: data?.originalCode,
    transformedCode: data?.transformedCode,
    isLoading,
    isError: !!error,
  };
}
