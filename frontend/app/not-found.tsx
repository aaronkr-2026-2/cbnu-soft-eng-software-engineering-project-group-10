import Link from 'next/link';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() { return <div className="container-page flex min-h-[520px] flex-col items-center justify-center text-center"><span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600"><Compass size={37}/></span><p className="eyebrow mt-6">404 · Lost page</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight">We couldn&apos;t find that page.</h1><p className="mt-4 max-w-md text-sm leading-7 text-slate-500">Even our lost & found team couldn&apos;t track it down. Return home or browse the latest campus listings.</p><Link className="btn-primary mt-7" href="/"><ArrowLeft size={17}/> Back to homepage</Link></div>; }
