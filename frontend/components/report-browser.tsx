'use client';
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { usePages, useResource } from '@/lib/use-resource';
import type { Catalogs, Report } from '@/lib/report-types';
import { ItemCard } from './item-card';
import { Loading, RequestError } from './request-state';

function ReportResults({
  query,
  mine = false,
}: {
  query: string;
  mine?: boolean;
}) {
  const list = usePages<Report>(
    `${mine ? '/me/reports' : '/reports'}?limit=12${query ? '&' + query : ''}`,
    mine,
  );
  return (
    <div aria-busy={list.loading || list.busy}>
      {list.loading && <Loading />}
      {list.error && <RequestError message={list.error} retry={list.retry} />}
      {!list.loading && !list.error && !list.items.length && (
        <div role="status" className="card-base p-12 text-center">
          <h2 className="text-xl font-bold">No reports found</h2>
          <p className="mt-3 text-slate-500">
            {mine
              ? 'Your published reports will appear here.'
              : 'Try another keyword or clear the filters.'}
          </p>
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      {list.pageError && (
        <RequestError message={list.pageError} retry={list.more} />
      )}
      {list.cursor && (
        <button
          disabled={list.busy}
          onClick={list.more}
          className="btn-secondary mx-auto mt-8 flex"
        >
          {list.busy ? 'Loading...' : 'Load more reports'}
        </button>
      )}
    </div>
  );
}
function FilteredReports() {
  const params = useSearchParams();
  const pathname = usePathname();
  const q = params.get('q') || '';
  const [search, setSearch] = useState(q);
  const [committedSearch, setCommittedSearch] = useState(q);
  if (q !== committedSearch) {
    setCommittedSearch(q);
    setSearch(q);
  }
  const catalogs = useResource<Catalogs>('/catalogs');
  const query = new URLSearchParams();
  for (const name of [
    'q',
    'report_type',
    'status',
    'category_id',
    'location_id',
  ]) {
    const value = params.get(name);
    if (value) query.set(name, value);
  }
  const serialized = query.toString();
  function change(name: string, value: string) {
    const next = new URLSearchParams(serialized);
    if (value) next.set(name, value);
    else next.delete(name);
    window.history.replaceState(null, '', `${pathname}${next.size ? '?' + next : ''}`);
  }
  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(() => {
      if (window.location.pathname !== pathname) return;
      const next = new URLSearchParams(serialized);
      if (search.trim()) next.set('q', search.trim());
      else next.delete('q');
      window.history.replaceState(null, '', `${pathname}${next.size ? '?' + next : ''}`);
    }, 350);
    return () => clearTimeout(timer);
  }, [search, q, serialized, pathname]);
  return (
    <>
      <div className="card-base mb-8 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-semibold">
          Keyword
          <input
            className="input-base mt-2"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title and description"
          />
        </label>
        <label className="text-sm font-semibold">
          Report type
          <select
            className="input-base mt-2"
            value={params.get('report_type') || ''}
            onChange={(e) => change('report_type', e.target.value)}
          >
            <option value="">All types</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Status
          <select
            className="input-base mt-2"
            value={params.get('status') || ''}
            onChange={(e) => change('status', e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="recovered">Recovered</option>
          </select>
        </label>
        {(['category_id', 'location_id'] as const).map((name, i) => (
          <label key={name} className="text-sm font-semibold">
            {i ? 'Location' : 'Category'}
            <select
              disabled={!catalogs.data}
              className="input-base mt-2"
              value={params.get(name) || ''}
              onChange={(e) => change(name, e.target.value)}
            >
              <option value="">All {i ? 'locations' : 'categories'}</option>
              {(i ? catalogs.data?.locations : catalogs.data?.categories)?.map(
                (c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ),
              )}
            </select>
          </label>
        ))}
        <button
          onClick={() => {
            setSearch('');
            window.history.replaceState(null, '', pathname);
          }}
          className="btn-secondary self-end"
        >
          Clear filters
        </button>
      </div>
      {catalogs.error && (
        <RequestError message={catalogs.error} retry={catalogs.retry} />
      )}
      {search.trim() !== q ? <Loading label="Updating search..."/> : <ReportResults key={serialized} query={serialized} />}
    </>
  );
}
export function ReportBrowser({
  compact = false,
  mine = false,
}: {
  compact?: boolean;
  mine?: boolean;
}) {
  return compact ? <ReportResults query="" mine={mine} /> : <FilteredReports />;
}
