'use client';

import ConfirmationNumberOutlined from '@mui/icons-material/ConfirmationNumberOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage title="Tickets" icon={ConfirmationNumberOutlined} phase={5} spec="docs/practice/02-tickets.md" />
  );
}
