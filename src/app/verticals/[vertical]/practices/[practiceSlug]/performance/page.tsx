'use client';

import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { PracticePlaceholderPage } from '@/features/shell/PlaceholderPages';

// Live copy: docs/practice/04-documents-and-placeholders.md.
export default function Page() {
  return (
    <PracticePlaceholderPage
      title="Performance"
      icon={TrendingUpOutlined}
      message="We are currently building the performance module. Soon you will be able to track objectives, key results, and team performance here."
    />
  );
}
