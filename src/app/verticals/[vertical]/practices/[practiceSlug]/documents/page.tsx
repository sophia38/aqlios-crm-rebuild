'use client';

import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import { PracticePlaceholderPage } from '@/features/shell/PlaceholderPages';

// Live copy: docs/practice/04-documents-and-placeholders.md.
export default function Page() {
  return (
    <PracticePlaceholderPage
      title="Documents"
      icon={DescriptionOutlined}
      message="We are currently building the public practice document management center. Soon you will be able to store, manage, and share practice documents here."
    />
  );
}
