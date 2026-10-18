import Link from 'next/link';
import { ArrowUpRight, Heart, MapPin } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div><Link href="/" className="flex items-center gap-2 text-lg font-extrabold"><span className="rounded-lg bg-blue-600 p-1.5 text-white"><MapPin size={19}/></span>Campus<span className="-ml-2 text-blue-600">Find</span></Link><p className="mt-4 max-w-xs text-sm leading-7 text-slate-500">A simpler way to reunite lost belongings with their people. Made for our campus community.</p></div>
        <div><h3 className="text-sm font-bold text-slate-900">Explore</h3><div className="mt-4 flex flex-col gap-3 text-sm text-slate-500"><Link href="/items" className="hover:text-blue-600">Browse items</Link><Link href="/post" className="hover:text-blue-600">Report an item</Link><Link href="/my-posts" className="hover:text-blue-600">My posts</Link></div></div>
        <div><h3 className="text-sm font-bold text-slate-900">A safer way to connect</h3><p className="mt-4 text-sm leading-7 text-slate-500">Meet in a public campus location and verify ownership before returning valuable belongings.</p><Link href="/items" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">Explore listings <ArrowUpRight size={15}/></Link></div>
      </div>
      <div className="border-t border-slate-100"><div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-400 sm:flex-row sm:justify-between"><span>© 2026 CampusFind. Software Engineering Project.</span><span className="inline-flex items-center gap-1">Built with <Heart size={12} className="text-rose-400"/> for students</span></div></div>
    </footer>
  );
}
