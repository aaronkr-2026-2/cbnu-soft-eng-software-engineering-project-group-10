'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, LogOut, Mail, UserRound } from 'lucide-react';
import { RequireLogin } from '@/components/require-login';
import { PageHeading } from '@/components/page-heading';
import { useCampus } from '@/lib/store';

function ProfileContent() {
  const router = useRouter();
  const { session, updateProfile, signOut } = useCampus();
  const [name, setName] = useState(session?.name || '');
  const [saved, setSaved] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (name.trim()) { updateProfile(name.trim()); setSaved(true); } }
  return <div className="container-page py-12 sm:py-16"><PageHeading eyebrow="Account settings" title="My profile" description="Manage the details shown on your campus posts."/><div className="grid max-w-4xl items-start gap-6 md:grid-cols-[240px_1fr]"><aside className="card-base p-6 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600"><UserRound size={36}/></span><h2 className="mt-4 font-bold">{session?.name}</h2><p className="mt-1 break-all text-xs text-slate-500">{session?.email}</p><Link href="/my-posts" className="btn-secondary mt-5 w-full">View my posts</Link></aside><div className="card-base p-6 sm:p-8"><h2 className="text-xl font-bold">Personal information</h2><p className="mt-1 text-sm text-slate-500">These details are used to identify the author of a listing.</p><form onSubmit={submit} className="mt-7 space-y-5"><div><label htmlFor="profile-name" className="label-base">Display name</label><input id="profile-name" className="input-base" maxLength={80} required value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }}/></div><div><label htmlFor="profile-email" className="label-base">Email</label><div className="relative"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input id="profile-email" className="input-base !pl-12 bg-slate-50" readOnly value={session?.email || ''}/></div></div>{saved && <p role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17}/> Profile name updated</p>}<div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><button type="button" className="btn-quiet !text-rose-600" onClick={() => { signOut(); router.replace('/'); }}><LogOut size={17}/> Log out</button><button type="submit" className="btn-primary">Save changes</button></div></form></div></div></div>;
}
export default function ProfilePage() { return <RequireLogin next="/profile"><ProfileContent/></RequireLogin>; }
