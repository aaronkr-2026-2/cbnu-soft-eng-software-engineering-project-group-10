'use client';

import Link from 'next/link';
import { CheckCheck, Plus } from 'lucide-react';
import { RequireLogin } from '@/components/require-login';
import { PageHeading } from '@/components/page-heading';
import { EmptyState } from '@/components/empty-state';
import { ItemCard } from '@/components/item-card';
import { useCampus } from '@/lib/store';

function MyPostsContent() {
  const { items, session } = useCampus();
  const mine = items.filter((item) => item.ownerEmail === session?.email);
  const active = mine.filter((item) => item.status === 'open').length;
  const recovered = mine.filter((item) => item.status === 'recovered').length;
  return <div className="container-page py-12 sm:py-16"><PageHeading eyebrow="Your activity" title="My posts" description="Everything you've reported, all in one place." action={<Link href="/post" className="btn-primary"><Plus size={18}/> Create a post</Link>}/>
    <div className="mb-8 grid gap-4 sm:grid-cols-3"><div className="card-base p-5"><p className="text-sm font-semibold text-slate-500">Total posts</p><p className="mt-2 text-3xl font-extrabold">{mine.length}</p></div><div className="card-base p-5"><p className="text-sm font-semibold text-slate-500">Active listings</p><p className="mt-2 text-3xl font-extrabold text-blue-600">{active}</p></div><div className="card-base p-5"><p className="flex items-center gap-2 text-sm font-semibold text-slate-500"><CheckCheck size={16}/> Recovered</p><p className="mt-2 text-3xl font-extrabold text-emerald-600">{recovered}</p></div></div>
    {mine.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{mine.map((item) => <ItemCard item={item} key={item.id}/>)}</div> : <EmptyState title="You haven't posted anything yet" description="Have you lost or found something? Your first post could make someone's day." showPost/>}
  </div>;
}
export default function MyPostsPage() { return <RequireLogin next="/my-posts"><MyPostsContent/></RequireLogin>; }
