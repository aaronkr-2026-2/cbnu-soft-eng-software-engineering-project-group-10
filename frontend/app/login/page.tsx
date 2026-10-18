'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { AuthShell } from '@/components/auth-shell';
import { useCampus } from '@/lib/store';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useCampus();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim().includes('@') || password.length < 6) { setError('Enter a valid email and at least 6 characters for your demo password.'); return; }
    const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    signIn({ email: email.trim().toLowerCase(), name });
    const next = params.get('next') || '/my-posts';
    router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/my-posts');
  }
  return <AuthShell mode="login" title="Welcome back." description="Log in to report an item and keep track of your campus listings.">
    <form onSubmit={submit} className="mt-8 space-y-5"><div><label htmlFor="login-email" className="label-base">Email address</label><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input id="login-email" autoComplete="email" className="input-base !pl-12" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@university.ac.kr"/></div></div>
      <div><label htmlFor="login-password" className="label-base">Password</label><div className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input id="login-password" className="input-base !pl-12 !pr-12" required minLength={6} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"/><button aria-label={showPassword ? 'Hide password' : 'Show password'} type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
      <button className="btn-primary !py-3.5 w-full" type="submit">Log in <ArrowRight size={18}/></button>
      <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-800"><strong>UI demo mode:</strong> Enter any valid email and a password of 6+ characters. No password is stored or verified. Connect Supabase Auth before production use.</p>
    </form>
  </AuthShell>;
}

export default function LoginPage() { return <Suspense fallback={<div className="container-page py-24">Loading...</div>}><LoginForm/></Suspense>; }
