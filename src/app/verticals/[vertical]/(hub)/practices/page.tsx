'use client';

import { useParams } from 'next/navigation';
import { InterimPracticeList } from '@/features/shell/InterimPracticeList';

export default function PracticesPage() {
  const { vertical } = useParams<{ vertical: string }>();
  return <InterimPracticeList vertical={vertical} />;
}
