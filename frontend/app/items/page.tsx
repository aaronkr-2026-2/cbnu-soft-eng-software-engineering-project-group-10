import { Suspense } from 'react';
import { ReportBrowser } from '@/components/report-browser';
export default function ItemsPage() {
  return (
    <div className="container-page py-12">
      <p className="eyebrow">Campus reports</p>
      <h1 className="my-3 text-4xl font-bold">Lost & found</h1>
      <p className="mb-8 text-slate-600">
        Search reports and help someone find what matters.
      </p>
      <Suspense fallback={<p>Loading filters...</p>}>
        <ReportBrowser />
      </Suspense>
    </div>
  );
}
