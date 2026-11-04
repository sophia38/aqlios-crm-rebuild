'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import GavelOutlined from '@mui/icons-material/GavelOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { useCurrentPractice, usePracticeCrumbs } from '@/features/practice/PracticeContext';
import { selectSession, useAppSelector } from '@/store';
import { ActivityTrackerTab } from './ActivityTrackerTab';
import { RotaManagementTab } from './RotaManagementTab';
import { ShiftBiddingTab } from './ShiftBiddingTab';

type Module = 'staffRota' | 'shiftBidding' | 'activityTracker';

const LABELS: Record<Module, string> = {
  staffRota: 'Staff Rota',
  shiftBidding: 'Shift Bidding',
  activityTracker: 'Activity Tracker',
};

/**
 * Practice ROTA (docs/practice/06-rota-management.md, plan §5): Staff Rota · Shift Bidding · Activity
 * Tracker, kept in the live `?module=shiftBidding` / `?module=activityTracker`. The vertical ROTA tabs
 * are reused with the practice fixed.
 */
export function PracticeRotaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const practice = useCurrentPractice();
  const isAdmin = Boolean(useAppSelector(selectSession).user?.isAdmin);
  const requested = useSearchParams().get('module');
  const tab: Module = requested === 'shiftBidding' || requested === 'activityTracker' ? requested : 'staffRota';
  usePracticeCrumbs([{ label: 'ROTA Management' }, ...(tab === 'staffRota' ? [] : [{ label: LABELS[tab] }])]);
  const fixed = { id: practice.id, practice_name: practice.practice_name };

  return (
    <Stack spacing={2.5}>
      <Box>
        <SegmentedTabs<Module>
          aria-label="ROTA sections"
          value={tab}
          onChange={(next) =>
            router.replace(next === 'staffRota' ? pathname : `${pathname}?module=${next}`, { scroll: false })
          }
          items={[
            { value: 'staffRota', label: 'Staff Rota', icon: <CalendarMonthOutlined /> },
            { value: 'shiftBidding', label: 'Shift Bidding', icon: <GavelOutlined /> },
            { value: 'activityTracker', label: 'Activity Tracker', icon: <TrendingUpOutlined /> },
          ]}
        />
      </Box>
      {/* Keyed by practice, so switching practice starts each tab again. */}
      {tab === 'staffRota' && <RotaManagementTab key={practice.id} practice={fixed} />}
      {tab === 'shiftBidding' && <ShiftBiddingTab key={practice.id} practiceId={practice.id} isManager={isAdmin} />}
      {tab === 'activityTracker' && <ActivityTrackerTab key={practice.id} practice={fixed} />}
    </Stack>
  );
}
