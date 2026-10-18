'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListFilter, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { PageHeading } from '@/components/page-heading';
import { ItemCard } from '@/components/item-card';
import { EmptyState } from '@/components/empty-state';
import { CATEGORIES } from '@/lib/types';
import { useCampus } from '@/lib/store';
import type { ItemKind } from '@/lib/types';

function BrowseItems() {
  const { items } = useCampus();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [kind, setKind] = useState<'all' | ItemKind>(() => { const value = searchParams.get('kind'); return value === 'lost' || value === 'found' ? value : 'all'; });
  const [category, setCategory] = useState(() => { const value = searchParams.get('category'); return value && CATEGORIES.includes(value as typeof CATEGORIES[number]) ? value : 'all'; });
  const [location, setLocation] = useState(searchParams.get('location') || 'all');
  const [hideRecovered, setHideRecovered] = useState(searchParams.get('open') === '1');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const locations = useMemo(() => Array.from(new Set(items.map((item) => item.location))).sort(), [items]);
  const results = useMemo(() => items.filter((item) => {
    const query = q.toLowerCase().trim();
    const matchesQuery = !query || [item.title, item.description, item.location, item.category].some((text) => text.toLowerCase().includes(query));
    return matchesQuery && (kind === 'all' || item.kind === kind) && (category === 'all' || item.category === category) && (location === 'all' || item.location === location) && (!hideRecovered || item.status === 'open');
  }).sort((a, b) => sort === 'newest' ? b.occurredAt.localeCompare(a.occurredAt) : a.occurredAt.localeCompare(b.occurredAt)), [items, q, kind, category, location, hideRecovered, sort]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (kind !== 'all') params.set('kind', kind);
    if (category !== 'all') params.set('category', category);
    if (location !== 'all') params.set('location', location);
    if (hideRecovered) params.set('open', '1');
    router.replace('/items' + (params.toString() ? `?${params}` : ''), { scroll: false });
  }
  function clear() { setQ(''); setKind('all'); setCategory('all'); setLocation('all'); setHideRecovered(false); router.replace('/items', { scroll: false }); }

  return <div className="container-page py-12 sm:py-16">
    <PageHeading eyebrow="Explore campus listings" title="Lost & found items" description="Discover recently reported items around campus. A small search can make a big difference." action={<Link href="/post" className="btn-primary"><Plus size={18}/> Post an item</Link>}/>
    <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="card-base p-5 lg:sticky lg:top-28"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-base font-bold"><SlidersHorizontal size={19} className="text-blue-600"/> Filters</h2><button onClick={clear} className="text-xs font-bold text-blue-600 hover:underline">Clear all</button></div>
        <div className="mt-6 space-y-5"><div><label className="label-base" htmlFor="browse-search">Search keyword</label><div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input id="browse-search" className="input-base !pl-10" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyFilters(); }} placeholder="AirPods, wallet..."/></div></div>
          <div><label className="label-base">Post type</label><div className="grid grid-cols-3 gap-2">{(['all', 'lost', 'found'] as const).map((value) => <button key={value} aria-pressed={kind === value} type="button" onClick={() => setKind(value)} className={`rounded-lg border px-2 py-2.5 text-xs font-bold capitalize transition ${kind === value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-200'}`}>{value}</button>)}</div></div>
          <div><label htmlFor="browse-category" className="label-base">Category</label><select id="browse-category" className="input-base" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div><label htmlFor="browse-location" className="label-base">Location</label><select id="browse-location" className="input-base" value={location} onChange={(e) => setLocation(e.target.value)}><option value="all">All locations</option>{locations.map((value) => <option key={value}>{value}</option>)}</select></div>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-600"><input className="h-4 w-4 accent-blue-600" type="checkbox" checked={hideRecovered} onChange={(e) => setHideRecovered(e.target.checked)}/> Open items only</label>
          <button onClick={applyFilters} className="btn-primary w-full"><ListFilter size={17}/> Apply filters</button></div>
      </aside>
      <section aria-label="Search results"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500"><span className="font-extrabold text-slate-900">{results.length}</span> {results.length === 1 ? 'item' : 'items'} found</p><div className="flex items-center gap-2"><label htmlFor="sort-order" className="text-xs font-semibold text-slate-500">Sort by</label><select id="sort-order" value={sort} onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></div></div>
        {(q || kind !== 'all' || category !== 'all' || location !== 'all' || hideRecovered) && <div className="mb-5 flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-slate-400">Current filters:</span>{[q && `“${q}”`, kind !== 'all' && kind, category !== 'all' && category, location !== 'all' && location, hideRecovered && 'Open only'].filter(Boolean).map((label) => <span key={String(label)} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{label}</span>)}<button className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600" onClick={clear}><X size={12}/> Reset</button></div>}
        {results.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{results.map((item) => <ItemCard key={item.id} item={item}/>)}</div> : <EmptyState title="No matching items" description="Try a broader keyword, another category, or remove one of your filters."/>}
      </section>
    </div>
  </div>;
}

function BrowseFromUrl() {
  const params = useSearchParams();
  return <BrowseItems key={params.toString()} />;
}

export default function ItemsPage() { return <Suspense fallback={<div className="container-page py-20 text-slate-500">Loading campus items...</div>}><BrowseFromUrl/></Suspense>; }
