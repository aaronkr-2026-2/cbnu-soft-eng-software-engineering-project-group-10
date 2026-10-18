'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, Clock3, Mail, MapPin, Pencil, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { useCampus } from '@/lib/store';
import { ItemVisual } from '@/components/visual';
import { KindBadge, RecoveryBadge } from '@/components/item-card';
import { formatFullDate } from '@/lib/data';
import { EmptyState } from '@/components/empty-state';
import { Suspense } from 'react';

function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const { items, session, ready, deleteItem, setRecovered } = useCampus();
  const item = items.find((record) => record.id === id);
  if (!ready) return <div className="container-page py-20 text-slate-400">Loading item details...</div>;
  if (!item) return <div className="container-page py-20"><EmptyState title="Item not found" description="This post may have been deleted or the link may be incorrect."/><div className="mt-5 text-center"><Link href="/items" className="text-sm font-semibold text-blue-600">← Back to all items</Link></div></div>;
  const isOwner = session?.email === item.ownerEmail;
  const mailto = `mailto:${item.ownerEmail}?subject=${encodeURIComponent(`CampusFind: ${item.title}`)}&body=${encodeURIComponent(`Hi ${item.ownerName},\n\nI saw your ${item.kind} item report on CampusFind: ${item.title}.\n\n`)}`;
  const created = params.get('created') === '1';
  const updated = params.get('updated') === '1';
  return <div className="container-page py-10 sm:py-14">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><Link href="/items" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft size={17}/> Back to listings</Link><div className="text-xs text-slate-400">Home <span className="mx-2">/</span> Items <span className="mx-2">/</span> Details</div></div>
    {(created || updated) && <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 size={19}/>{created ? 'Your post has been published successfully.' : 'Your changes have been saved.'}</div>}
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6"><div className="card-base overflow-hidden"><ItemVisual large item={item} className="h-[290px] w-full sm:h-[420px]"/><div className="p-6 sm:p-8"><div className="flex flex-wrap items-center gap-2"><KindBadge kind={item.kind}/><RecoveryBadge status={item.status}/><span className="ml-auto text-xs font-semibold uppercase tracking-wider text-slate-400">{item.category}</span></div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{item.title}</h1><p className="mt-3 text-sm text-slate-400">Posted by {item.ownerName}</p>
        <div className="mt-7 grid gap-4 border-y border-slate-100 py-6 sm:grid-cols-2"><div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-600"><MapPin size={20}/></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.kind === 'lost' ? 'Last seen' : 'Found at'}</p><p className="mt-1 font-semibold text-slate-800">{item.location}</p></div></div><div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-600"><CalendarDays size={20}/></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</p><p className="mt-1 font-semibold text-slate-800">{formatFullDate(item.occurredAt)}</p></div></div></div>
        <h2 className="mt-7 text-lg font-bold">About this item</h2><p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">{item.description}</p>
      </div></div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50 px-6 py-5"><div className="flex items-start gap-3"><ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-600"/><div><h3 className="font-bold text-slate-900">Stay safe when returning items</h3><p className="mt-2 text-sm leading-7 text-slate-600">Verify ownership before handing over valuables. Use public, well-lit campus locations, and don’t share sensitive personal details.</p></div></div></div>
      </div>
      <aside className="space-y-5 lg:sticky lg:top-28"><div className="card-base p-6"><div className="flex items-center gap-2 text-sm font-bold text-slate-900"><span className="h-2 w-2 rounded-full bg-emerald-500"/> {item.status === 'open' ? 'This listing is active' : 'This item was recovered'}</div><h2 className="mt-5 text-xl font-extrabold tracking-tight">{isOwner ? 'Manage your post' : item.kind === 'lost' ? 'Have you found this?' : 'Is this yours?'}</h2><p className="mt-2 text-sm leading-7 text-slate-500">{isOwner ? 'Update details or close this listing once the item is back with its owner.' : 'Reach out to the person who posted this item and help it get home.'}</p>
        {isOwner ? <div className="mt-6 space-y-3"><Link href={`/items/${id}/edit`} className="btn-primary w-full"><Pencil size={17}/> Edit post</Link><button type="button" onClick={() => setRecovered(id, item.status === 'open')} className="btn-secondary w-full"><BadgeCheck size={17}/> {item.status === 'open' ? 'Mark as recovered' : 'Reopen listing'}</button><button type="button" onClick={() => { if (window.confirm('Delete this post permanently?')) { deleteItem(id); router.push('/my-posts'); } }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={17}/> Delete post</button></div>
          : item.status === 'open' ? <a href={mailto} className="btn-primary mt-6 w-full"><Mail size={18}/> Contact {item.kind === 'lost' ? 'owner' : 'finder'} <ArrowRight size={17}/></a> : <div className="mt-6 rounded-xl bg-slate-100 p-4 text-sm font-semibold text-slate-500">This post is closed to new inquiries.</div>}
        {!isOwner && item.status === 'open' && <p className="mt-3 text-center text-xs leading-5 text-slate-400">Opens your email app. Please verify ownership before meeting.</p>}
      </div>
      <div className="card-base p-6"><h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Posted by</h3><div className="mt-4 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600"><UserRound size={23}/></div><div><p className="font-bold">{item.ownerName}</p><p className="mt-0.5 text-xs text-slate-500">CampusFind community member</p></div></div><div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500"><Clock3 size={16}/> Reported {formatFullDate(item.createdAt)}</div></div>
      </aside>
    </div>
  </div>;
}

export default function ItemPage() { return <Suspense fallback={<div className="container-page py-20">Loading...</div>}><ItemDetail/></Suspense>; }
