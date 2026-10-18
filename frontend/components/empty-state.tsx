import Link from 'next/link';
import { Inbox, Plus } from 'lucide-react';

export function EmptyState({ title = 'Nothing here yet', description = 'Try updating your filters or checking back later.', showPost = false }: { title?: string; description?: string; showPost?: boolean }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center"><span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500"><Inbox size={30}/></span><h3 className="text-xl font-bold text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>{showPost && <Link href="/post" className="btn-primary mt-6"><Plus size={17}/> Create a post</Link>}</div>;
}
