'use client';

import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import { ComingSoonPage } from '@/features/shell/PlaceholderPages';

export default function HubNotificationsPage() {
  return (
    <ComingSoonPage
      title="Notifications"
      icon={NotificationsNoneOutlined}
      message="Stay informed about your vertical's activity. Soon this page will centralize all hub-level alerts, system announcements, and practice/business activity logs."
    />
  );
}
