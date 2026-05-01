"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const cache = new Map<string, { data: any; timestamp: number }>();

export function useCachedFetch<T>(url: string, ttlMs = 30000) {
  const [data, setData] = useState<T | null>(() => {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return cached.data as T;
    }
    return null;
  });
  const [loading, setLoading] = useState(!cache.has(url));
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      cache.set(url, { data: json, timestamp: Date.now() });
      if (mountedRef.current) {
        setData(json);
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < ttlMs) {
      setData(cached.data);
      setLoading(false);
      // Background revalidate
      refetch();
    } else {
      setLoading(true);
      refetch();
    }
    return () => { mountedRef.current = false; };
  }, [url, refetch, ttlMs]);

  return { data, loading, refetch };
}
