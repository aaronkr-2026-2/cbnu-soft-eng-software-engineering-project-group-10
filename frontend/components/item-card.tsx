import Link from 'next/link';
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react';
import { ItemVisual } from '@/components/visual';
import { formatDate } from '@/lib/data';
import type { CampusItem } from '@/lib/types';

export function KindBadge({ kind }: { kind: CampusItem['kind'] }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${kind === 'lost' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>{kind}</span>;
}

export function RecoveryBadge({ status }: { status: CampusItem['status'] }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${status === 'open' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'open' ? 'bg-blue-500' : 'bg-slate-400'}`}/>{status === 'open' ? 'Open' : 'Recovered'}</span>;
}

export function ItemCard({ item }: { item: CampusItem }) {
  return (
    <Link href={`/items/${item.id}`} className="group card-base flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-soft">
      <div className="relative overflow-hidden"><ItemVisual item={item} className="h-48 w-full transition duration-300 group-hover:scale-[1.025]"/><div className="absolute left-4 top-4 flex gap-2"><KindBadge kind={item.kind}/>{item.status === 'recovered' && <RecoveryBadge status={item.status}/>}</div></div>
      <div className="flex flex-1 flex-col p-5"><span className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{item.category}</span><h3 className="line-clamp-1 text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-700">{item.title}</h3><p className="mt-2 line-clamp-2 min-h-[42px] text-sm leading-[21px] text-slate-500">{item.description}</p>
        <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-500"><div className="flex items-center gap-2"><MapPin className="shrink-0 text-slate-400" size={16}/><span className="truncate">{item.location}</span></div><div className="flex items-center gap-2"><CalendarDays className="shrink-0 text-slate-400" size={16}/>{formatDate(item.occurredAt)}</div></div>
        <div className="mt-5 flex items-center justify-between font-semibold text-blue-600"><span className="text-sm">View details</span><ArrowUpRight size={18} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></div>
      </div>
    </Link>
  );
}
