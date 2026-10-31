'use client';
import Link from 'next/link';
import { RequireLogin } from '@/components/require-login';
import { Loading, RequestError } from '@/components/request-state';
import { usePages } from '@/lib/use-resource';
import { useCampus } from '@/lib/store';
import type { Conversation } from '@/lib/report-types';
function Rooms() {
  const rooms = usePages<Conversation>('/conversations?limit=20', true);
  return (
    <div className="container-page max-w-4xl py-12">
      <div className="mb-7 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inbox</h1>
        <button className="btn-secondary" onClick={rooms.retry}>
          Refresh
        </button>
      </div>
      <p className="mb-6 text-slate-500">
        Private conversations, ordered by when they were started.
      </p>
      {rooms.loading && <Loading label="Loading conversations..." />}
      {rooms.error && (
        <RequestError message={rooms.error} retry={rooms.retry} />
      )}
      {!rooms.loading && !rooms.error && !rooms.items.length && (
        <div className="card-base p-8">
          <p>No conversations yet. Open a report to contact its author.</p>
          <Link href="/items" className="btn-primary mt-5">
            Browse reports
          </Link>
        </div>
      )}
      <div className="space-y-3">
        {rooms.items.map((room) => (
          <Link
            key={room.id}
            href={`/inbox/${room.id}`}
            className="card-base block p-5 hover:border-blue-300"
          >
            <h2 className="break-words font-bold">{room.report_title}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {room.report_deleted
                ? 'Report deleted · Read-only history'
                : 'Open conversation'}{' '}
              →
            </p>
          </Link>
        ))}
      </div>
      {rooms.pageError && (
        <RequestError message={rooms.pageError} retry={rooms.more} />
      )}
      {rooms.cursor && (
        <button
          className="btn-secondary mt-6"
          disabled={rooms.busy}
          onClick={rooms.more}
        >
          {rooms.busy ? 'Loading...' : 'Load more conversations'}
        </button>
      )}
    </div>
  );
}
export default function Inbox() {
  const { session } = useCampus();
  return (
    <RequireLogin next="/inbox">
      <Rooms key={session?.id} />
    </RequireLogin>
  );
}
