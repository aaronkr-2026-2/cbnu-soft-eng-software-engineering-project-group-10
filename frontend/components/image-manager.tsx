'use client';
import { useEffect, useRef, useState } from 'react';
import type { Report } from '@/lib/report-types';
import { useCampus } from '@/lib/store';
import { apiError, imageUrl } from '@/services/api.service';
import { ReportPhoto } from './visual';
export function ImageManager({
  report,
  owner,
  onChange,
}: {
  report: Report;
  owner: boolean;
  onChange: () => void;
}) {
  const { authorized } = useCampus();
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // The object URL must be released when selection changes or the editor unmounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function mutate(imageId?: string) {
    if (pending.current) return;
    if (imageId && !confirm('Remove this photo?')) return;
    if (!imageId && !file) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setProgress(0);
    try {
      if (imageId)
        await authorized(`/reports/${report.id}/images/${imageId}`, {
          method: 'DELETE',
        });
      else {
        const body = new FormData();
        body.append('file', file!);
        await authorized(`/reports/${report.id}/images`, {
          method: 'POST',
          body,
          onProgress: setProgress,
        });
        setFile(undefined);
        if (input.current) input.current.value = '';
      }
      onChange();
    } catch (cause) {
      setError(
        apiError(cause) +
          ' Refresh the report before retrying an upload if the connection was interrupted.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">Photos ({report.images.length}/3)</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {report.images.map((photo) => (
          <div key={photo.id}>
            <ReportPhoto
              src={imageUrl(photo.url)}
              alt={report.title}
              className="h-40 w-full rounded-xl"
            />
            {owner && (
              <button
                disabled={busy}
                onClick={() => mutate(photo.id)}
                className="btn-secondary mt-2 w-full"
              >
                Remove photo
              </button>
            )}
          </div>
        ))}
      </div>
      {owner && report.images.length < 3 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-5">
          <label className="label-base" htmlFor="report-image">
            Add a photo
          </label>
          <input
            ref={input}
            id="report-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="w-full text-sm"
            onChange={(e) => {
              setError('');
              const selected = e.target.files?.[0];
              setFile(undefined);
              if (!selected) return;
              if (
                !['image/jpeg', 'image/png', 'image/webp'].includes(
                  selected.type,
                ) ||
                selected.size > 4 * 1024 * 1024
              ) {
                setError('Choose a JPEG, PNG or WebP up to 4 MiB.');
                e.target.value = '';
                return;
              }
              setFile(selected);
            }}
          />
          <p className="mt-2 text-xs text-slate-500">
            JPEG, PNG or WebP, up to 4 MiB and 16 million pixels. No animated
            images.
          </p>
          {file && (
            <>
              <ReportPhoto
                key={preview}
                src={preview}
                alt="Selected photo preview"
                className="mt-4 h-40 w-full rounded-xl"
              />
              <button
                disabled={busy}
                onClick={() => mutate()}
                className="btn-primary mt-3"
              >
                {busy
                  ? `Uploading ${progress}% — processing may take a moment`
                  : 'Upload photo'}
              </button>
            </>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="text-rose-700">
          {error}
        </p>
      )}
    </section>
  );
}
