'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Inbox from '@mui/icons-material/InboxOutlined';
import Outbox from '@mui/icons-material/OutboxOutlined';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { usePracticeCrumbs } from '@/features/practice/PracticeContext';
import { AppointmentRequestsTab } from './AppointmentRequestsTab';
import { AppointmentsTab } from './AppointmentsTab';

type Tab = 'appointments' | 'requests';

/**
 * Appointment (docs/practice/03-appointment.md, plan §3). The tab is kept in `?tab=requests` so it
 * can be linked (live keeps it in page state), and the Requests tab has its own header (fixes the
 * reused live header).
 */
export function AppointmentPage() {
  const router = useRouter();
  const pathname = usePathname();
  const tab: Tab = useSearchParams().get('tab') === 'requests' ? 'requests' : 'appointments';
  usePracticeCrumbs([{ label: 'Appointment' }]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <SegmentedTabs<Tab>
          aria-label="Appointment sections"
          tone="brand"
          value={tab}
          onChange={(next) =>
            router.replace(next === 'requests' ? `${pathname}?tab=requests` : pathname, { scroll: false })
          }
          items={[
            { value: 'appointments', label: 'Appointment', icon: <Inbox /> },
            { value: 'requests', label: 'Appointment Requests', icon: <Outbox /> },
          ]}
        />
      </Box>
      {tab === 'requests' ? (
        <>
          <ModulePageHeader title="Appointment Requests" subtitle="Review requests to book a different staff member." />
          <AppointmentRequestsTab />
        </>
      ) : (
        <>
          <ModulePageHeader title="Appointment" subtitle="Manage and schedule patient appointments" />
          <AppointmentsTab />
        </>
      )}
    </Stack>
  );
}
