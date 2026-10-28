'use client';

import BadgeOutlined from '@mui/icons-material/BadgeOutlined';
import { PracticePlaceholderPage } from '@/features/shell/PlaceholderPages';

// Live copy: docs/practice/04-documents-and-placeholders.md.
export default function Page() {
  return (
    <PracticePlaceholderPage
      title="Recruitment"
      icon={BadgeOutlined}
      message="We are currently building the recruitment module. Soon you will be able to manage job openings, candidates, and interviews here."
    />
  );
}
