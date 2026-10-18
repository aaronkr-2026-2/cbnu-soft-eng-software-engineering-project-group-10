'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpRight, Menu, Plus, Search, UserRound, X, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useCampus } from '@/lib/store';

const routes = [
  { href: '/items', label: 'Browse items' },
  { href: '/my-posts', label: 'My posts' }
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready, signOut } = useCampus();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const close = () => setOpen(false);
  const navigateSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    close();
    router.push('/items' + (search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''));
  };
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
      <div className="container-page flex h-[76px] items-center gap-5">
        <Link href="/" onClick={close} className="flex shrink-0 items-center gap-2.5" aria-label="CampusFind home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm"><MapPin size={23} strokeWidth={2.7} /></span>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">Campus<span className="text-blue-600">Find</span></span>
        </Link>
        <nav className="ml-7 hidden items-center gap-2 lg:flex" aria-label="Main navigation">
          {routes.map(({ href, label }) => <Link key={href} href={href} className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${pathname === href ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>{label}</Link>)}
        </nav>
        <form onSubmit={navigateSearch} className="relative ml-auto hidden w-full max-w-[245px] xl:block">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Search items" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lost & found..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white" />
        </form>
        <div className="ml-auto hidden items-center gap-3 lg:ml-0 lg:flex">
          {ready && session ? <Link href="/profile" className="btn-quiet"><UserRound size={17} /> {session.name.split(' ')[0]}</Link> : <Link href="/login" className="btn-quiet">Log in <ArrowUpRight size={15} /></Link>}
          <Link href="/post" className="btn-primary !px-4 !py-2.5"><Plus size={18} /> Post an item</Link>
        </div>
        <button aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="ml-auto rounded-lg border border-slate-200 p-2 lg:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
      {open && <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-4 lg:hidden">
        <form onSubmit={navigateSearch} className="mb-4 flex gap-2"><input value={search} onChange={(e) => setSearch(e.target.value)} className="input-base" placeholder="Search items..." aria-label="Search items"/><button className="btn-primary" aria-label="Search"><Search size={18}/></button></form>
        <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
          {routes.map((route) => <Link key={route.href} href={route.href} onClick={close} className="rounded-lg px-3 py-3 font-medium text-slate-700 hover:bg-slate-50">{route.label}</Link>)}
          <Link href="/post" onClick={close} className="btn-primary mt-2"><Plus size={17}/> Post an item</Link>
          {session ? <><Link href="/profile" onClick={close} className="btn-secondary">My profile</Link><button onClick={() => { signOut(); close(); router.push('/'); }} className="btn-quiet">Log out</button></> : <><Link href="/login" onClick={close} className="btn-secondary">Log in</Link><Link href="/register" onClick={close} className="btn-secondary">Create account</Link></>}
        </nav>
      </div>}
    </header>
  );
}
