import Link from 'next/link';
import { ArrowRight, Search, MessageCircle, ClipboardList } from 'lucide-react';
import { ReportBrowser } from '@/components/report-browser';
export default function Home() {
  return (
    <>
      <section className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <p className="eyebrow">Lost & found, together</p>
          <h1 className="mt-5 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Lost something?
            <span className="block text-blue-600">Let’s find it.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Search campus reports, share what you found, and help belongings
            find their way home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/items" className="btn-primary">
              Browse items <ArrowRight size={18} />
            </Link>
            <Link href="/post" className="btn-secondary">
              Report an item
            </Link>
          </div>
        </div>
        <div className="card-base space-y-6 p-8">
          <h2 className="text-xl font-bold">A little help goes a long way.</h2>
          {[
            [Search, 'Search campus reports'],
            [ClipboardList, 'Share details and photos'],
            [MessageCircle, 'Connect in a private conversation'],
          ].map(([Icon, title], i) => {
            const Symbol = Icon as typeof Search;
            return (
              <div key={i} className="flex items-center gap-4">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Symbol size={22} />
                </span>
                <p className="font-medium">{title as string}</p>
              </div>
            );
          })}
          <p className="text-sm leading-6 text-slate-500">
            Meet in a public campus location and verify ownership before
            returning valuables.
          </p>
        </div>
      </section>
      <section className="container-page pb-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Around campus</p>
            <h2 className="mt-2 text-3xl font-bold">Recent reports</h2>
          </div>
          <Link href="/items" className="text-sm font-semibold text-blue-600">
            View all →
          </Link>
        </div>
        <ReportBrowser compact />
      </section>
    </>
  );
}
