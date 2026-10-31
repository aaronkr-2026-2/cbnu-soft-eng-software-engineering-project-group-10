export function RequestError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="my-5 rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-800"
    >
      <p>{message}</p>
      <button className="btn-secondary mt-3" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
export function Loading({ label = 'Loading reports...' }: { label?: string }) {
  return (
    <div
      role="status"
      className="my-8 rounded-2xl bg-slate-100 p-8 text-slate-600"
    >
      {label} The first request may take a moment.
    </div>
  );
}
