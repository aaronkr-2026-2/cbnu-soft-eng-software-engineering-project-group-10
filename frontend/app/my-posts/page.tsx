'use client';
import Link from 'next/link';
import { RequireLogin } from '@/components/require-login';
import { ReportBrowser } from '@/components/report-browser';
import { useCampus } from '@/lib/store';
export default function MyPostsPage() {
  const { session } = useCampus();
  return (
    <RequireLogin next="/my-posts">
      <div className="container-page py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">My posts</h1>
          <Link href="/post" className="btn-primary">
            Create a post
          </Link>
        </div>
        <ReportBrowser key={session?.id} mine compact />
      </div>
    </RequireLogin>
  );
}
