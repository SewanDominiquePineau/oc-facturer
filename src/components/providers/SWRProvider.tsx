'use client';

import { SWRConfig } from 'swr';

const swrConfig = {
  dedupingInterval: 2000,
  revalidateOnFocus: false,
  errorRetryCount: 2,
  shouldRetryOnError: (err: Error) => {
    if (err.message.includes('401') || err.message.includes('403')) return false;
    return true;
  },
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
