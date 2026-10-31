'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RequireLogin } from '@/components/require-login';
import { PageHeading } from '@/components/page-heading';
import { useCampus } from '@/lib/store';

function ProfileContent() {
  const router = useRouter();
  const { session, signOut } = useCampus();
  const [busy, setBusy] = useState(false);
  async function leave() {
    if (busy) return;
    setBusy(true);
    try {
      if (await signOut()) router.replace('/login');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container-page py-12 sm:py-16">
      <PageHeading
        eyebrow="Account"
        title="My profile"
        description="Your registered campus account."
      />
      <div className="card-base max-w-xl space-y-6 p-6 sm:p-8">
        <dl className="space-y-4">
          <div>
            <dt className="label-base">Full name</dt>
            <dd className="break-words">{session?.name}</dd>
          </div>
          <div>
            <dt className="label-base">Email</dt>
            <dd className="break-all">{session?.email}</dd>
          </div>
        </dl>
        <p className="text-sm text-slate-500">
          Profile editing is not available yet. Your reports and conversations
          are saved on the server. Reloading the page requires signing in again.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/my-posts" className="btn-secondary">
            View my posts
          </Link>
          <button disabled={busy} onClick={leave} className="btn-primary">
            {busy ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default function ProfilePage() {
  return (
    <RequireLogin next="/profile">
      <ProfileContent />
    </RequireLogin>
  );
}
