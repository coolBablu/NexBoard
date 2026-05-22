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
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        {children}
        <Toaster />
      </SWRConfig>
    </SessionProvider>
  );
}
