"use client";

import Link from "next/link";
import { useState } from "react";
import { useCampus } from "@/lib/store";
import { ItemCard } from "@/components/item-card";
import { ItemVisual } from "@/components/visual";
import { formatFullDate } from "@/lib/data";

export default function Home() {
  const { items } = useCampus();
  const featured = items.find((item) => item.kind === "found" && item.status === "open");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "Lost" | "Found">("All");

  const filteredItems = items.filter((item) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword);

    const matchesFilter = filter === "All" || item.kind === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              🎓 Made for university campuses
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Lost something?
              <span className="block text-blue-600">
                Let&apos;s find it.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              CampusFind brings lost and found items into one place. Search
              campus reports, post lost belongings, or help return an item to
              its owner.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#items"
                className="rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Browse Items
              </a>

              <Link
                href="/post"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                + Report an Item
              </Link>
            </div>
          </div>

          {/* Hero visual */}
          {featured && <div className="relative mx-auto w-full max-w-lg">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/60">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Recently found</p>
                  <h3 className="text-xl font-bold">{featured.title}</h3>
                </div>

                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  FOUND
                </span>
              </div>

              <ItemVisual item={featured} large className="h-64 rounded-2xl" />

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span>📍</span>
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-semibold">{featured.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                  <span>📅</span>
                  <div>
                    <p className="text-xs text-slate-400">Found on</p>
                    <p className="text-sm font-semibold">{formatFullDate(featured.occurredAt)}</p>
                  </div>
                </div>
              </div>

              <Link href={`/items/${featured.id}`} className="mt-5 block text-center w-full rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800">
                View Details
              </Link>
            </div>

            <div className="absolute -right-5 -top-7 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
              <p className="text-xs text-slate-400">Status</p>
              <p className="font-bold text-emerald-600">✓ Item Found</p>
            </div>
          </div>}
        </div>
      </section>

      {/* Search */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/40">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-xl bg-slate-50 px-4">
                <span className="text-xl">🔍</span>

                <input
                  aria-label="Search campus reports"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search AirPods, wallet, library..."
                  className="h-14 w-full bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2">
                {(["All", "Lost", "Found"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${filter === status
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Items */}
      <section id="items" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-semibold text-blue-600">Campus reports</p>
            <h2 className="text-3xl font-bold tracking-tight">
              Recent lost & found items
            </h2>

            <p className="mt-2 text-slate-500">
              Check recent reports from students around campus.
            </p>
          </div>

          <Link href="/items" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View all items →
          </Link>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="text-5xl">🔍</div>

            <h3 className="mt-4 text-xl font-bold">No items found</h3>

            <p className="mt-2 text-slate-500">
              Try another keyword or change the filter.
            </p>
          </div>
        )}
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="font-semibold text-blue-600">Simple process</p>

            <h2 className="mt-2 text-3xl font-bold">
              Find your belongings in three steps
            </h2>

            <p className="mt-4 text-slate-500">
              CampusFind makes reporting and recovering lost items simple.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                🔍
              </div>

              <p className="mb-2 text-sm font-bold text-blue-600">STEP 01</p>

              <h3 className="text-xl font-bold">Search</h3>

              <p className="mt-3 leading-7 text-slate-500">
                Search by item name, category, location or status to find
                related campus reports.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-2xl">
                📝
              </div>

              <p className="mb-2 text-sm font-bold text-violet-600">STEP 02</p>

              <h3 className="text-xl font-bold">Report</h3>

              <p className="mt-3 leading-7 text-slate-500">
                Create a lost or found post with item details, location, date,
                description and an image.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl">
                🤝
              </div>

              <p className="mb-2 text-sm font-bold text-emerald-600">STEP 03</p>

              <h3 className="text-xl font-bold">Recover</h3>

              <p className="mt-3 leading-7 text-slate-500">
                Contact the finder or owner and mark the report as recovered
                after the item is returned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="overflow-hidden rounded-3xl bg-slate-950 px-8 py-14 text-center text-white sm:px-14">
          <p className="font-semibold text-blue-400">
            Help your campus community
          </p>

          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold sm:text-4xl">
            Found something that doesn&apos;t belong to you?
          </h2>

          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-400">
            Create a report in less than a minute and help another student
            recover their belongings.
          </p>

          <Link
            href="/post"
            className="mt-8 inline-block rounded-xl bg-blue-600 px-7 py-3.5 font-semibold text-white transition hover:bg-blue-500"
          >
            Report Found Item
          </Link>
        </div>
      </section>

    </div>
  );
}
