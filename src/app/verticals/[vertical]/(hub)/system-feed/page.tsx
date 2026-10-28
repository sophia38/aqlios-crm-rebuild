'use client';

import HeadsetMicOutlined from '@mui/icons-material/HeadsetMicOutlined';
import { ComingSoonPage } from '@/features/shell/PlaceholderPages';

// Live copy (docs/super-admin/11-system-feed-and-notifications.md), in the shared placeholder design.
export default function SystemFeedPage() {
  return (
    <ComingSoonPage
      title="System Feed"
      icon={HeadsetMicOutlined}
      message="We are currently building the hub-level activity feed management. Soon you will be able to manage your vertical-wide activity feed here."
    />
  );
}
