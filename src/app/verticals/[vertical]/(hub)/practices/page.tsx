'use client';

import { useParams } from 'next/navigation';
import { PracticeGridPage } from '@/features/practices/PracticeGridPage';

export default function PracticesPage() {
  const { vertical } = useParams<{ vertical: string }>();
  return <PracticeGridPage vertical={vertical} />;
}
