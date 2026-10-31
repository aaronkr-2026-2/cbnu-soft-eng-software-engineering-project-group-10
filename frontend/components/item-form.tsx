'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCampus } from '@/lib/store';
import { useResource } from '@/lib/use-resource';
import type { Catalogs, Report, ReportDraft } from '@/lib/report-types';
import { apiError } from '@/services/api.service';
import { Loading, RequestError } from './request-state';

export function seoulToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
export function ItemForm({
  initial,
  editId,
}: {
  initial?: Report;
  editId?: string;
}) {
  const catalogs = useResource<Catalogs>('/catalogs');
  const { authorized } = useCampus();
  const router = useRouter();
  const [draft, setDraft] = useState<ReportDraft>({
    title: initial?.title || '',
    description: initial?.description || '',
    report_type: initial?.report_type || 'lost',
    category_id: initial?.category.id || '',
    location_id: initial?.location.id || '',
    occurred_on: initial?.occurred_on || seoulToday(),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    if (!draft.title.trim() || !draft.description.trim()) {
      setError('Enter a title and description.');
      return;
    }
    pending.current = true;
    setSaving(true);
    setError('');
    try {
      const { report_type, ...editable } = draft;
      const body = editId ? editable : { ...editable, report_type };
      const report = await authorized<Report>(
        editId ? `/reports/${editId}` : '/reports',
        { method: editId ? 'PATCH' : 'POST', body },
      );
      router.push(`/items/${report.id}`);
    } catch (cause) {
      setError(apiError(cause));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }
  if (catalogs.loading)
    return <Loading label="Loading categories and locations..." />;
  if (catalogs.error)
    return <RequestError message={catalogs.error} retry={catalogs.retry} />;
  return (
    <form
      onSubmit={submit}
      className="card-base max-w-3xl space-y-6 p-6 sm:p-8"
    >
      <fieldset disabled={saving} className="space-y-6">
        <label className="label-base">
          Report type
          <select
            disabled={!!editId || saving}
            className="input-base mt-2"
            value={draft.report_type}
            onChange={(e) =>
              setDraft({
                ...draft,
                report_type: e.target.value as 'lost' | 'found',
              })
            }
          >
            <option value="lost">I lost an item</option>
            <option value="found">I found an item</option>
          </select>
        </label>
        {editId && (
          <p className="text-sm text-slate-500">
            The original lost/found type cannot be changed.
          </p>
        )}
        <label className="label-base">
          Title
          <input
            autoFocus
            required
            maxLength={120}
            className="input-base mt-2"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          {(['category_id', 'location_id'] as const).map((name, i) => (
            <label key={name} className="label-base">
              {i ? 'Location' : 'Category'}
              <select
                required
                className="input-base mt-2"
                value={draft[name]}
                onChange={(e) => setDraft({ ...draft, [name]: e.target.value })}
              >
                <option value="">Select {i ? 'location' : 'category'}</option>
                {(i
                  ? catalogs.data?.locations
                  : catalogs.data?.categories
                )?.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label className="label-base">
          Date (campus time)
          <input
            type="date"
            min="1900-01-01"
            max={seoulToday()}
            required
            className="input-base mt-2"
            value={draft.occurred_on}
            onChange={(e) =>
              setDraft({ ...draft, occurred_on: e.target.value })
            }
          />
        </label>
        <label className="label-base">
          Description
          <textarea
            rows={7}
            required
            maxLength={3000}
            className="input-base mt-2"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />
        </label>
        <p className="text-sm text-slate-500">
          You can add up to three photos from the report details after saving.
          Avoid including student numbers or private contact details.
        </p>
        {error && (
          <p role="alert" className="text-rose-700">
            {error}
          </p>
        )}
        <button disabled={saving} className="btn-primary" aria-busy={saving}>
          {saving ? 'Saving...' : editId ? 'Save changes' : 'Publish report'}
        </button>
      </fieldset>
    </form>
  );
}
