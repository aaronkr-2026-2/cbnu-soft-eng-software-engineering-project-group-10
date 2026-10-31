'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { useCampus } from '@/lib/store';
import { useResource } from '@/lib/use-resource';
import { useOwnership } from '@/lib/use-ownership';
import type { Report, Conversation } from '@/lib/report-types';
import { apiError } from '@/services/api.service';
import { KindBadge, RecoveryBadge } from '@/components/item-card';
import { ItemVisual } from '@/components/visual';
import { ImageManager } from '@/components/image-manager';
import { Loading, RequestError } from '@/components/request-state';
import { formatFullDate } from '@/lib/data';

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  return <Detail key={id} id={id} />;
}
function Detail({ id }: { id: string }) {
  const report = useResource<Report>(`/reports/${id}`);
  const owner = useOwnership(id);
  const { session, authorized } = useCampus();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function action(kind: 'status' | 'delete' | 'chat') {
    if (pending.current || !report.data) return;
    if (
      kind === 'delete' &&
      !window.confirm(
        'Delete this report and its photos? Existing conversations will become read-only.',
      )
    )
      return;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      if (kind === 'chat') {
        const room = await authorized<Conversation>('/conversations', {
          method: 'POST',
          body: { report_id: id },
        });
        router.push(`/inbox/${room.id}`);
      } else if (kind === 'delete') {
        await authorized(`/reports/${id}`, { method: 'DELETE' });
        router.push('/my-posts');
      } else {
        await authorized(`/reports/${id}`, {
          method: 'PATCH',
          body: {
            status: report.data.status === 'open' ? 'recovered' : 'open',
          },
        });
        report.retry();
      }
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  const item = report.data;
  return (
    <div className="container-page py-10">
      <Link href="/items" className="font-semibold text-blue-600">
        ← Back to reports
      </Link>
      {report.loading && <Loading label="Loading report..." />}
      {report.error && (
        <RequestError message={report.error} retry={report.retry} />
      )}
      {item && (
        <div className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="card-base overflow-hidden">
            <ItemVisual item={item} className="h-72 sm:h-96" />
            <div className="space-y-6 p-6 sm:p-8">
              <div className="flex gap-2">
                <KindBadge kind={item.report_type} />
                <RecoveryBadge status={item.status} />
              </div>
              <h1 className="break-words text-3xl font-bold">{item.title}</h1>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-slate-500">Location</dt>
                  <dd className="font-semibold">{item.location.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Date</dt>
                  <dd className="font-semibold">
                    {formatFullDate(item.occurred_on)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-slate-500">Category</dt>
                  <dd>{item.category.name}</dd>
                </div>
              </dl>
              <h2 className="text-xl font-bold">About this item</h2>
              <p className="whitespace-pre-wrap break-words leading-8 text-slate-600">
                {item.description}
              </p>
              <ImageManager
                key={session?.id || 'public'}
                report={item}
                owner={owner.owned}
                onChange={report.retry}
              />
            </div>
          </article>
          <aside className="card-base space-y-4 p-6">
            <h2 className="text-xl font-bold">
              {owner.owned ? 'Manage your report' : 'Connect privately'}
            </h2>
            {owner.loading && session && (
              <p role="status">Checking report ownership...</p>
            )}
            {owner.error && (
              <RequestError message={owner.error} retry={owner.retry} />
            )}
            {owner.owned ? (
              <>
                <Link href={`/items/${id}/edit`} className="btn-primary w-full">
                  Edit report
                </Link>
                <button
                  disabled={busy}
                  onClick={() => action('status')}
                  className="btn-secondary w-full"
                >
                  {item.status === 'open'
                    ? 'Mark as recovered'
                    : 'Reopen report'}
                </button>
                <button
                  disabled={busy}
                  onClick={() => action('delete')}
                  className="btn-secondary w-full text-rose-700"
                >
                  Delete report
                </button>
              </>
            ) : !session ? (
              <Link
                href={`/login?next=/items/${id}`}
                className="btn-primary w-full"
              >
                Sign in to contact
              </Link>
            ) : (
              <button
                disabled={busy || owner.loading || !!owner.error}
                onClick={() => action('chat')}
                className="btn-primary w-full"
              >
                {busy ? 'Opening...' : 'Open conversation'}
              </button>
            )}
            {error && (
              <p role="alert" className="text-rose-700">
                {error}
              </p>
            )}
            <p className="text-sm leading-6 text-slate-500">
              Verify ownership before handing over valuables. Meet in a public
              campus location. Email addresses and student numbers are kept
              private.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
