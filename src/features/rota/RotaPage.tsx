'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { ActivityTrackerTab } from './ActivityTrackerTab';
import { RotaGroupsTab } from './RotaGroupsTab';
import { RotaManagementTab } from './RotaManagementTab';

type Tab = 'rota' | 'rota-groups' | 'activity-tracker';

/**
 * Vertical ROTA: three tabs under a sticky tab bar (docs/super-admin/06-rota-management.md).
 * Fix: the tab is kept in `?tab=`, so it can be linked and survives a refresh (live: no URL change).
 */
export function RotaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const requested = useSearchParams().get('tab');
  const tab: Tab = requested === 'rota-groups' || requested === 'activity-tracker' ? requested : 'rota';

  return (
    <HubManagementLayout>
      <Box
        sx={(theme) => ({
          position: 'sticky',
          top: 0,
          zIndex: 4,
          mx: { xs: -2, md: -3 },
          mt: { xs: -2, md: -3 },
          mb: 2.5,
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 3 },
          pb: 1.5,
          bgcolor: theme.tokens.surface.panel,
          borderRadius: `${theme.tokens.radius.panel}px ${theme.tokens.radius.panel}px 0 0`,
        })}
      >
        <SegmentedTabs<Tab>
          aria-label="ROTA sections"
          value={tab}
          onChange={(next) => router.replace(next === 'rota' ? pathname : `${pathname}?tab=${next}`, { scroll: false })}
          items={[
            { value: 'rota', label: 'Rota Management', icon: <CalendarMonthOutlined /> },
            { value: 'rota-groups', label: 'Rota Groups', icon: <GroupsOutlined /> },
            { value: 'activity-tracker', label: 'Activity Tracker', icon: <TrendingUpOutlined /> },
          ]}
        />
      </Box>
      {tab === 'rota' && <RotaManagementTab />}
      {tab === 'rota-groups' && <RotaGroupsTab />}
      {tab === 'activity-tracker' && <ActivityTrackerTab />}
    </HubManagementLayout>
  );
}
