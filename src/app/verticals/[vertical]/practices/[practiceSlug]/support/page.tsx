'use client';

import ContactPhoneOutlined from '@mui/icons-material/ContactPhoneOutlined';
import { PracticePlaceholderPage } from '@/features/shell/PlaceholderPages';

// Live copy: docs/practice/04-documents-and-placeholders.md.
export default function Page() {
  return (
    <PracticePlaceholderPage
      title="Support"
      icon={ContactPhoneOutlined}
      message="We are currently building the public practice support center. Soon you will be able to access help resources and contact dedicated support here."
    />
  );
}
