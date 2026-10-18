'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCampus } from '@/lib/store';
import { ItemForm } from '@/components/item-form';
import { PageHeading } from '@/components/page-heading';
import { RequireLogin } from '@/components/require-login';

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const { items, session, ready } = useCampus();
  const item = items.find((item) => item.id === id);
  return <RequireLogin next={`/items/${id}/edit`}><div className="container-page py-12 sm:py-16">{!ready ? <p>Loading...</p> : !item || item.ownerEmail !== session?.email ? <div className="card-base mx-auto max-w-xl p-10 text-center"><h1 className="text-2xl font-bold">Cannot edit this post</h1><p className="mt-3 text-sm text-slate-500">Only the author can edit an existing post.</p><Link href="/my-posts" className="btn-primary mt-6">View my posts</Link></div> : <><PageHeading eyebrow="Update listing" title="Edit your post" description="Correct the details so your campus community has the latest information."/><ItemForm initial={item} editId={id}/></>}</div></RequireLogin>;
}
