'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { useCampus } from '@/lib/store';
import type { ReactNode } from 'react';

export function RequireLogin({ children, next }: { children: ReactNode; next: string }) {
  const { session, ready } = useCampus();
  if (!ready) return <div className="container-page py-24 text-center text-slate-400">Loading your workspace...</div>;
  if (!session) return <div className="container-page py-24"><div className="card-base mx-auto max-w-lg px-8 py-12 text-center"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><LockKeyhole size={28}/></span><h1 className="mt-5 text-2xl font-bold">Sign in to continue</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">Create your campus profile to report lost and found items and manage your posts.</p><Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-primary mt-7">Log in <ArrowRight size={17}/></Link><div className="mt-5 text-sm text-slate-500">New here? <Link className="font-semibold text-blue-600" href={`/register?next=${encodeURIComponent(next)}`}>Create an account</Link></div></div></div>;
  return <>{children}</>;
}
