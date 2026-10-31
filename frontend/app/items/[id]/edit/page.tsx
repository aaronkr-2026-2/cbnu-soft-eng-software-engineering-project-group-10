'use client';
import { useParams } from 'next/navigation';
import { RequireLogin } from '@/components/require-login';
import { ItemForm } from '@/components/item-form';
import { Loading, RequestError } from '@/components/request-state';
import { useResource } from '@/lib/use-resource';
import { useOwnership } from '@/lib/use-ownership';
import type { Report } from '@/lib/report-types';
function Edit({ id }: { id: string }) {
  const report = useResource<Report>(`/reports/${id}`);
  const owner = useOwnership(id);
  return (
    <div className="container-page py-12">
      <h1 className="mb-8 text-3xl font-bold">Edit report</h1>
      {(report.loading || owner.loading) && <Loading />}
      {report.error && (
        <RequestError message={report.error} retry={report.retry} />
      )}
      {owner.error && (
        <RequestError message={owner.error} retry={owner.retry} />
      )}
      {owner.owned && report.data && (
        <ItemForm initial={report.data} editId={id} />
      )}
      {!owner.loading && !owner.error && !owner.owned && (
        <p>Only the report author can edit this post.</p>
      )}
    </div>
  );
}
export default function EditPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequireLogin next={`/items/${id}/edit`}>
      <Edit key={id} id={id} />
    </RequireLogin>
  );
}
