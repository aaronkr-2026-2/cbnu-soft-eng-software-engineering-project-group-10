import Link from 'next/link';
import { MapPin, CalendarDays } from 'lucide-react';
import { ItemVisual } from './visual';
import { formatDate } from '@/lib/data';
import type { Report } from '@/lib/report-types';
export function KindBadge({ kind }: { kind: Report['report_type'] }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${kind === 'lost' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}
    >
      {kind}
    </span>
  );
}
export function RecoveryBadge({ status }: { status: Report['status'] }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
      {status}
    </span>
  );
}
export function ItemCard({ item }: { item: Report }) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="card-base group overflow-hidden transition hover:border-blue-300 hover:shadow-lg"
    >
      <ItemVisual item={item} className="h-48" />
      <div className="space-y-4 p-5">
        <div className="flex gap-2">
          <KindBadge kind={item.report_type} />
          <RecoveryBadge status={item.status} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {item.category.name}
        </p>
        <h3 className="break-words text-xl font-bold group-hover:text-blue-700">
          {item.title}
        </h3>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin size={16} />
          {item.location.name}
        </p>
        <p className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays size={16} />
          {formatDate(item.occurred_on)}
        </p>
        <p className="text-sm font-semibold text-blue-600">View details →</p>
      </div>
    </Link>
  );
}
