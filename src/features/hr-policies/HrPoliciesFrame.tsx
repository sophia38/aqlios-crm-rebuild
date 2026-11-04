'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import LibraryBooksOutlined from '@mui/icons-material/LibraryBooksOutlined';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';

export type HrPoliciesTab = 'ask' | 'library';

const LABELS: Record<HrPoliciesTab, string> = { ask: 'Ask HR', library: 'Policy Library' };

/**
 * HR Policies tabs (docs/practice/08-hr-policies-and-settings.md §1): Ask HR · Policy Library are
 * real routes, as live, under the breadcrumb `HRM / HR Policies / {tab}`.
 */
export function HrPoliciesFrame({ tab, children }: { tab: HrPoliciesTab; children: React.ReactNode }) {
  const router = useRouter();
  const practiceHref = usePracticeHref();
  usePracticeCrumbs([
    { label: 'HRM' },
    { label: 'HR Policies', href: practiceHref('/hr-policies/ask') },
    { label: LABELS[tab] },
  ]);

  return (
    <Stack spacing={2.5}>
      <Box>
        <SegmentedTabs<HrPoliciesTab>
          aria-label="HR Policies sections"
          value={tab}
          onChange={(next) => router.push(practiceHref(`/hr-policies/${next}`))}
          items={[
            { value: 'ask', label: LABELS.ask, icon: <AutoAwesomeOutlined /> },
            { value: 'library', label: LABELS.library, icon: <LibraryBooksOutlined /> },
          ]}
        />
      </Box>
      {children}
    </Stack>
  );
}

/** The white rounded card both tabs sit in, with its title, subtitle and an optional action on the right. */
export function HrCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={(theme) => ({
        p: { xs: 2, md: 3 },
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.card}px`,
        border: `1px solid ${theme.tokens.border.medium}`,
      })}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 2.5 }}
      >
        <Box>
          <Typography component="h1" sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography variant="body2">{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
      {children}
    </Box>
  );
}
