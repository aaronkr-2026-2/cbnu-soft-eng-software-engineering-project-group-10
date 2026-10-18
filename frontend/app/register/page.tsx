'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { AuthShell } from '@/components/auth-shell';
import { useCampus } from '@/lib/store';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn } = useCampus();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !email.trim().includes('@') || password.length < 6) { setError('Please complete all fields with a valid email and 6+ character password.'); return; }
    if (!agree) { setError('Please confirm that you will use the platform responsibly.'); return; }
    signIn({ name: name.trim(), email: email.trim().toLowerCase() });
    const next = params.get('next') || '/my-posts';
    router.replace(next.startsWith('/') && !next.startsWith('//') ? next : '/my-posts');
  }
  return <AuthShell mode="register" title="Create your account." description="One account. One campus community. More lost items finding their way home.">
    <form onSubmit={submit} className="mt-8 space-y-5"><div><label htmlFor="register-name" className="label-base">Full name</label><div className="relative"><UserRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input id="register-name" autoComplete="name" className="input-base !pl-12" type="text" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"/></div></div>
      <div><label htmlFor="register-email" className="label-base">University email</label><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input id="register-email" autoComplete="email" className="input-base !pl-12" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@university.ac.kr"/></div></div>
      <div><label htmlFor="register-password" className="label-base">Password</label><div className="relative"><LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/><input id="register-password" autoComplete="new-password" className="input-base !pl-12 !pr-12" required type={showPassword ? 'text' : 'password'} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters"/><button aria-label={showPassword ? 'Hide password' : 'Show password'} type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
      <label className="flex cursor-pointer items-start gap-3 text-xs leading-6 text-slate-500"><input required checked={agree} onChange={(e) => setAgree(e.target.checked)} type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-blue-600"/> I agree to use CampusFind responsibly and keep sensitive personal information out of public posts.</label>
      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
      <button className="btn-primary !py-3.5 w-full" type="submit">Create account <ArrowRight size={18}/></button>
      <p className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs leading-6 text-amber-800"><strong>UI demo mode:</strong> The account is a local preview only. The password is never stored or verified, and email ownership is not checked. Connect Supabase Auth for real accounts.</p>
    </form>
  </AuthShell>;
}

export default function RegisterPage() { return <Suspense fallback={<div className="container-page py-24">Loading...</div>}><RegisterForm/></Suspense>; }
