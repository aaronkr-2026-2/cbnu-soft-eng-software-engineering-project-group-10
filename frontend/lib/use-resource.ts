'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiError, request } from '@/services/api.service';
import { useCampus } from './store';
import type { Page } from './report-types';

export function useResource<T>(path: string | null, privateRequest = false) {
  const { authorized, accessToken } = useCampus();
  const key = `${privateRequest ? accessToken : ''}:${path}`;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    key: string;
    attempt: number;
    data?: T;
    error?: string;
  }>({ key: '', attempt: -1 });
  useEffect(() => {
    if (!path || (privateRequest && !accessToken)) return;
    const controller = new AbortController();
    const load = privateRequest
      ? authorized<T>(path, { signal: controller.signal })
      : request<T>(path, { signal: controller.signal });
    void load
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, attempt, data });
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setState({ key, attempt, error: apiError(cause) });
      });
    return () => controller.abort();
  }, [path, privateRequest, accessToken, authorized, key, attempt]);
  const current = state.key === key && state.attempt === attempt;
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    loading: !!path && !current,
    retry: useCallback(() => setAttempt((n) => n + 1), []),
  };
}

export function usePages<T extends { id: string }>(
  path: string,
  privateRequest = false,
) {
  const { authorized, accessToken } = useCampus();
  const key = `${privateRequest ? accessToken : ''}:${path}`;
  const first = useResource<Page<T>>(path, privateRequest);
  const [extra, setExtra] = useState<{ first?: Page<T>; pages: Page<T>[] }>({
    pages: [],
  });
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const generation = useRef(key);
  useEffect(() => {
    generation.current = key;
  }, [key]);
  const pages = extra.first === first.data ? extra.pages : [];
  const cursor = pages.length
    ? pages[pages.length - 1].next_cursor
    : first.data?.next_cursor;
  const items = Array.from(
    new Map(
      [...(first.data?.items || []), ...pages.flatMap((p) => p.items)].map(
        (item) => [item.id, item],
      ),
    ).values(),
  );
  async function more() {
    if (!cursor || pending.current) return;
    pending.current = true;
    setBusy(true);
    setFailure('');
    const target = `${path}${path.includes('?') ? '&' : '?'}cursor=${encodeURIComponent(cursor)}`;
    try {
      const page = privateRequest
        ? await authorized<Page<T>>(target)
        : await request<Page<T>>(target);
      if (generation.current === key)
        setExtra({ first: first.data, pages: [...pages, page] });
    } catch (cause) {
      if (generation.current === key) setFailure(apiError(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return { ...first, items, cursor, more, busy, pageError: failure };
}
