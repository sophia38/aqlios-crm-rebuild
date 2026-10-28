'use client';

import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage title="Appointment" icon={EventNoteOutlined} phase={5} spec="docs/practice/03-appointment.md" />
  );
}
