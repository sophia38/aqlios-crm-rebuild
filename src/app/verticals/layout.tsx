'use client';

import { AuthGate } from '@/components/auth/AuthGate';

export default function VerticalsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}
