'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Save from '@mui/icons-material/SaveOutlined';
import { StatusChip } from '@/components/data/StatusChip';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { EntityAvatar } from '@/components/primitives/EntityAvatar';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { SELF_STAFF_ID, STAFF_STATUS_LABELS, staffApi } from '@/lib/api/staff';
import type { StaffDetail } from '@/lib/api/types';
import { AccountDetailsTab } from './components/AccountDetailsTab';
import { CompetenciesTab } from './components/CompetenciesTab';
import { ComplianceTab } from './components/ComplianceTab';
import { LeaveTab } from './components/LeaveTab';
import { PayrollTab } from './components/PayrollTab';
import { SecurityTab } from './components/SecurityTab';
import type { SaveBinding } from './staffForm';
import { STAFF_PATH, staffName } from './staffRoutes';

type Tab = 'account' | 'leave' | 'compliance' | 'competencies' | 'payroll' | 'security';

const TABS: { value: Tab; label: string }[] = [
  { value: 'account', label: 'Account Details' },
  { value: 'leave', label: 'Leave Management' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'competencies', label: 'Competencies' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'security', label: 'Security' },
];

type LoadState =
  { status: 'loading' } | { status: 'ready'; staff: StaffDetail } | { status: 'not-found' } | { status: 'error' };

/**
 * Staff Member Details (docs/practice/05-staff-onboarding.md §6, plan §4b). The same page is the
 * signed-in user's Profile (`staffId="me"`), with the extra Security tab. Save Changes (top right)
 * saves the current tab and is disabled until something changes. The tab is kept in `?tab=`.
 */
export function StaffDetailsPage({ staffId }: { staffId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const profile = staffId === SELF_STAFF_ID;
  usePracticeCrumbs(
    profile
      ? [{ label: 'Profile' }]
      : [{ label: 'Staff Management', href: STAFF_PATH }, { label: 'Staff Member Details' }],
  );

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [binding, setBinding] = useState<SaveBinding | null>(null);
  const bind = useCallback((next: SaveBinding | null) => setBinding(next), []);

  useEffect(() => {
    const controller = new AbortController();
    staffApi
      .get(PUBLIC_SUB_APP_ID, practice.id, staffId, controller.signal)
      .then((staff) => setState({ status: 'ready', staff }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: error instanceof ApiError && error.code === 404 ? 'not-found' : 'error' });
      });
    return () => controller.abort();
  }, [practice.id, staffId, reloadKey]);

  if (state.status === 'loading') return <LoadingSpinner message="Loading staff member..." />;
  if (state.status === 'not-found') {
    return (
      <AccessDenied
        title="Staff member not found"
        message="They may have been removed, or the link is wrong."
        backHref={practiceHref(STAFF_PATH)}
        backLabel="Go to Staff Management"
      />
    );
  }
  if (state.status === 'error') {
    return (
      <Stack spacing={2} role="alert" sx={{ alignItems: 'center', py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</Typography>
        <Typography variant="body2">Could not load this staff member.</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setState({ status: 'loading' });
            setReloadKey((key) => key + 1);
          }}
        >
          Try again
        </Button>
      </Stack>
    );
  }

  const { staff } = state;
  const self = staff.is_self;
  const tabs = TABS.filter((item) => item.value !== 'security' || self);
  const tab = tabs.find((item) => item.value === params.get('tab'))?.value ?? 'account';
  const onSaved = (next: StaffDetail) => setState({ status: 'ready', staff: next });
  const tabProps = { staff, self, onSaved, bind };
  const name = staffName(staff);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <GoBackLink
          variant="pill"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push(practiceHref(profile ? '/dashboard' : STAFF_PATH));
          }}
        >
          Back
        </GoBackLink>
      </Box>
      <ModulePageHeader
        title="Staff Member Details"
        actions={
          <Button
            variant="contained"
            startIcon={<Save />}
            disabled={!binding?.dirty || binding.submitting || tab === 'compliance'}
            loading={binding?.submitting}
            onClick={() => void binding?.submit()}
          >
            Save Changes
          </Button>
        }
      />
      <Stack
        direction="row"
        spacing={2}
        sx={(theme) => ({
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: 1.5,
          p: 2,
          mb: 2.5,
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.card}px`,
          border: `1px solid ${theme.tokens.border.medium}`,
        })}
      >
        <EntityAvatar name={name} size={52} />
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary' }}>
            {name}
          </Typography>
          <Typography variant="body2">
            {staff.practice_name} · {staff.staff_type}
          </Typography>
        </Box>
        <StatusChip
          status={staff.rota_group_names.length ? `Rota Group: ${staff.rota_group_names.join(', ')}` : 'No Rota Group'}
          tone="primary"
          variant="outlined"
        />
        <StatusChip status={STAFF_STATUS_LABELS[staff.status]} />
      </Stack>
      <Box sx={{ mb: 2.5 }}>
        <SegmentedTabs<Tab>
          aria-label="Staff details sections"
          value={tab}
          onChange={(next) => {
            const query = new URLSearchParams(params.toString());
            if (next === 'account') query.delete('tab');
            else query.set('tab', next);
            const text = query.toString();
            router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
          }}
          items={tabs}
        />
      </Box>
      {/* Each tab is its own form; switching tabs drops unsaved edits, as live. */}
      {tab === 'account' && <AccountDetailsTab {...tabProps} />}
      {tab === 'leave' && <LeaveTab {...tabProps} />}
      {tab === 'compliance' && <ComplianceTab staff={staff} self={self} onSaved={onSaved} />}
      {tab === 'competencies' && <CompetenciesTab {...tabProps} />}
      {tab === 'payroll' && <PayrollTab {...tabProps} />}
      {tab === 'security' && self && <SecurityTab bind={bind} />}
    </>
  );
}
