'use client';

import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import { PracticePlaceholderPage } from '@/features/shell/PlaceholderPages';

// Live copy: docs/practice/04-documents-and-placeholders.md.
export default function Page() {
  return (
    <PracticePlaceholderPage
      title="Notifications"
      icon={NotificationsNoneOutlined}
      message="We are currently building the public practice notification system. Soon you will be able to configure alerts, reminders, and messaging preferences here."
    />
  );
}
