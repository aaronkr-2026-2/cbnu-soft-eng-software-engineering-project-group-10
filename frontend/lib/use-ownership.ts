'use client';
import { useEffect, useState } from 'react';
import { useCampus } from './store';
import type { Page, Report } from './report-types';
import { apiError } from '@/services/api.service';
export function useOwnership(id: string) {
  const { authorized, accessToken } = useCampus();
  const key = `${accessToken}:${id}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    attempt: number;
    owned: boolean;
    error?: string;
  }>();
  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    async function find() {
      let cursor: string | null = null;
      do {
        const page: Page<Report> = await authorized(
          '/me/reports?limit=50' +
            (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''),
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        if (page.items.some((item) => item.id === id)) {
          setResult({ key, attempt, owned: true });
          return;
        }
        cursor = page.next_cursor;
      } while (cursor);
      setResult({ key, attempt, owned: false });
    }
    void find().catch((cause) => {
      if (!controller.signal.aborted)
        setResult({ key, attempt, owned: false, error: apiError(cause) });
    });
    return () => controller.abort();
  }, [authorized, accessToken, id, key, attempt]);
  const current = result?.key === key && result.attempt === attempt;
  return {
    owned: !!accessToken && current && result.owned,
    loading: !!accessToken && !current,
    error: current ? result.error : undefined,
    retry: () => setAttempt((n) => n + 1),
  };
}
