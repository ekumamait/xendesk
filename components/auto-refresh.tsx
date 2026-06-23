"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Periodically refreshes the server component tree so changes made by other
 * users (e.g. an agent updating status) appear without a manual reload.
 */
export function AutoRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(interval);
  }, [router, intervalMs]);

  return null;
}
