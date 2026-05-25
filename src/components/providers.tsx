"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/sonner";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          // Avoid refetch storms on tab focus / network reconnect — the
          // app polls explicitly where it matters (notifications, chat).
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          shouldRetryOnError: false,
          // Coalesce duplicate calls to the same key into a single fetch.
          dedupingInterval: 30_000,
          // Throttle in case any code path still triggers focus revals.
          focusThrottleInterval: 60_000,
          // Keep previously-fetched data on screen while a refetch is in
          // flight — eliminates the "blank skeleton flash" on navigation.
          keepPreviousData: true,
        }}
      >
        {children}
        <Toaster />
      </SWRConfig>
    </SessionProvider>
  );
}
