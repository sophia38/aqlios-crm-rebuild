'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGate } from '@/components/auth/AuthGate';

function GoToVerticals() {
  const router = useRouter();
  useEffect(() => router.replace('/verticals'), [router]);
  return null;
}

/** "/" sends signed-in users to /verticals; AuthGate sends everyone else to /auth/login. */
export default function Home() {
  return (
    <AuthGate>
      <GoToVerticals />
    </AuthGate>
  );
}
