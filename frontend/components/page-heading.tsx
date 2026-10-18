import type { ReactNode } from 'react';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="eyebrow mb-3">{eyebrow}</p><h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">{description}</p>}</div>{action && <div className="shrink-0">{action}</div>}</div>;
}
