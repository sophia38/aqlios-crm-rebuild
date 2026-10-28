'use client';

import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { PracticeProfilePage } from '@/features/practices/PracticeProfilePage';

// Live URL keeps the practice in the query string (?practiceId=&subAppId=), so one static page serves all.
export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading practice profile..." />}>
      <PracticeProfilePage />
    </Suspense>
  );
}
