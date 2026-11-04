'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import Groups from '@mui/icons-material/GroupsOutlined';
import History from '@mui/icons-material/History';
import HowToReg from '@mui/icons-material/HowToRegOutlined';
import LockOpen from '@mui/icons-material/LockOpenOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import MarkEmailUnread from '@mui/icons-material/MarkEmailUnreadOutlined';
import Unarchive from '@mui/icons-material/UnarchiveOutlined';
import UploadFile from '@mui/icons-material/UploadFileOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatsStrip } from '@/components/data/StatsStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/modals/ConfirmDialog';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { STAFF_REASON_MAX, STAFF_STATUS_LABELS, staffApi } from '@/lib/api/staff';
import {
  PRACTICE_STAFF_STATUSES,
  PRACTICE_STAFF_TYPES,
  STAFF_INVITE_STATUSES,
  type PracticeStaff,
  type StaffAction,
  type StaffListParams,
  type StaffListTab,
  type StaffSummary,
} from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { BulkImportModal } from './components/BulkImportModal';
import { InviteStaffModal } from './components/InviteStaffModal';
import { STAFF_PATH, staffName, staffPath } from './staffRoutes';

const TABS: { value: StaffListTab; label: string; title: string; crumb: string; icon: React.ReactNode }[] = [
  { value: 'staff', label: 'Staff List', title: 'Staff List', crumb: 'Staff List', icon: <Groups /> },
  {
    value: 'invitations',
    label: 'Sent Invitations',
    title: 'Sent Invitations',
    crumb: 'Sent Invitations',
    icon: <History />,
  },
  {
    value: 'archived',
    label: 'Archived Users',
    title: 'Archived Staff',
    crumb: 'Archived Staff',
    icon: <ArchiveOutlined />,
  },
];

/**
 * Staff Management (docs/practice/05-staff-onboarding.md, plan §4a). The tab is kept in `?tab=` so it
 * can be linked (live keeps it in page state).
 */
export function StaffListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get('tab');
  const tab = TABS.find((item) => item.value === param) ?? TABS[0];
  const [inviting, setInviting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  usePracticeCrumbs([{ label: 'Staff Management', href: STAFF_PATH }, { label: tab.crumb }]);

  const reload = () => setReloadKey((key) => key + 1);

  return (
    <Stack spacing={2.5}>
      <Box>
        <SegmentedTabs<StaffListTab>
          aria-label="Staff lists"
          value={tab.value}
          onChange={(next) =>
            router.replace(next === 'staff' ? pathname : `${pathname}?tab=${next}`, { scroll: false })
          }
          items={TABS.map(({ value, label, icon }) => ({ value, label, icon }))}
        />
      </Box>
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
          <Typography component="h1" sx={{ fontSize: 20, fontWeight: 700, color: 'text.primary' }}>
            {tab.title}
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {tab.value === 'staff' && (
              <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setImporting(true)}>
                Bulk Import Staff
              </Button>
            )}
            {tab.value !== 'archived' && (
              <Button variant="contained" startIcon={<AddCircleOutline />} onClick={() => setInviting(true)}>
                Invite Staff
              </Button>
            )}
          </Stack>
        </Stack>
        {/* A fresh table per tab, so filters and paging start again. */}
        <StaffTable key={`${tab.value}-${reloadKey}`} tab={tab.value} />
      </Box>
      <InviteStaffModal
        open={inviting}
        onClose={() => setInviting(false)}
        onInvited={() => {
          setInviting(false);
          reload();
        }}
      />
      <BulkImportModal
        open={importing}
        onClose={() => setImporting(false)}
        // Closing is up to the dialog: it stays open to list rows that need fixing.
        onImported={reload}
      />
    </Stack>
  );
}

type Pending = { staff: PracticeStaff; action: Exclude<StaffAction, 'resend-invite'> };

function StaffTable({ tab }: { tab: StaffListTab }) {
  const theme = useTheme();
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  const [summary, setSummary] = useState<StaffSummary | null>(null);
  const [summaryKey, setSummaryKey] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback<PagedFetcher<PracticeStaff>>(
    (params, signal) => staffApi.list(PUBLIC_SUB_APP_ID, practice.id, { ...params, tab } as StaffListParams, signal),
    [practice.id, tab],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: '-invited_at',
    errorText: 'Could not load staff.',
    errorToast: 'Failed to load staff',
  });

  useEffect(() => {
    if (tab !== 'staff') return;
    const controller = new AbortController();
    staffApi
      .summary(PUBLIC_SUB_APP_ID, practice.id, controller.signal)
      .then(setSummary)
      .catch(() => {
        if (!controller.signal.aborted) enqueueSnackbar('Failed to load staff totals', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practice.id, tab, summaryKey, enqueueSnackbar]);

  const refresh = () => {
    list.reload();
    setSummaryKey((key) => key + 1);
  };

  const act = async (staff: PracticeStaff, action: StaffAction, reason?: string) => {
    const toasts: Record<StaffAction, [string, string]> = {
      lock: ['User locked', 'Failed to lock the user'],
      unlock: ['User unlocked', 'Failed to unlock the user'],
      archive: ['Staff archived', 'Failed to archive the staff member'],
      unarchive: ['Staff unarchived', 'Failed to unarchive the staff member'],
      approve: ['Staff approved', 'Failed to approve the staff member'],
      reject: ['Staff rejected', 'Failed to reject the staff member'],
      'resend-invite': ['Invitation resent', 'Failed to resend the invitation'],
    };
    setBusy(true);
    try {
      await staffApi.action(PUBLIC_SUB_APP_ID, practice.id, staff.id, action, reason);
      enqueueSnackbar(toasts[action][0], { variant: 'success' });
      setPending(null);
      refresh();
    } catch (error) {
      // A refused action (400) explains itself; anything else gets the generic message.
      enqueueSnackbar(error instanceof ApiError && error.code === 400 ? error.message : toasts[action][1], {
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const iconButton = (
    label: string,
    title: string,
    icon: React.ReactNode,
    onClick: () => void,
    color: string = theme.palette.text.secondary,
  ) => (
    <Tooltip title={title}>
      <IconButton aria-label={label} size="small" onClick={onClick} sx={{ color }}>
        {icon}
      </IconButton>
    </Tooltip>
  );

  const columns: DataTableColumn<PracticeStaff>[] = [
    {
      id: 'name',
      label: 'Staff Name',
      render: (staff) => {
        const name = `${staff.first_name} ${staff.last_name}`.trim();
        return (
          <Box sx={{ minWidth: 180 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{name || staff.email}</Typography>
            {name && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                {staff.email}
              </Typography>
            )}
            {staff.phone && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                {staff.phone}
              </Typography>
            )}
          </Box>
        );
      },
    },
    { id: 'type', label: 'Staff Type', render: (staff) => staff.staff_type },
    { id: 'practice', label: 'Practice', render: (staff) => <Box sx={{ minWidth: 140 }}>{staff.practice_name}</Box> },
    {
      id: 'status',
      label: 'Status',
      render: (staff) => <StatusChip status={STAFF_STATUS_LABELS[staff.status]} />,
    },
    {
      id: 'invited',
      label: 'Invited Date',
      sortKey: 'invited_at',
      render: (staff) => <Box sx={{ whiteSpace: 'nowrap' }}>{dayjs(staff.invited_at).format('DD/MM/YYYY')}</Box>,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      // Room for up to 4 icons (Pending Approval rows).
      width: 170,
      render: (staff) => {
        const name = staffName(staff);
        return (
          <Stack direction="row" spacing={0.25} sx={{ justifyContent: 'center' }}>
            <Tooltip title="View staff">
              <IconButton
                component={Link}
                href={practiceHref(staffPath(staff.id))}
                aria-label={`View ${name}`}
                size="small"
                sx={{ color: 'primary.main' }}
              >
                <VisibilityOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            {/* Fix: live's underlined status chip resends with no hint; this is a labelled button. */}
            {STAFF_INVITE_STATUSES.includes(staff.status) &&
              !staff.archived &&
              iconButton(
                `Resend invite to ${name}`,
                'Resend invite',
                <MarkEmailUnread fontSize="small" />,
                () => void act(staff, 'resend-invite'),
              )}
            {staff.status === 'PENDING_APPROVAL' && !staff.archived && (
              <>
                {iconButton(
                  `Approve ${name}`,
                  'Approve',
                  <HowToReg fontSize="small" />,
                  () => setPending({ staff, action: 'approve' }),
                  theme.tokens.tone.success.main,
                )}
                {iconButton(
                  `Reject ${name}`,
                  'Reject',
                  <CancelOutlined fontSize="small" />,
                  () => setPending({ staff, action: 'reject' }),
                  theme.tokens.tone.error.main,
                )}
              </>
            )}
            {staff.archived
              ? iconButton(`Unarchive ${name}`, 'Unarchive staff', <Unarchive fontSize="small" />, () =>
                  setPending({ staff, action: 'unarchive' }),
                )
              : iconButton(`Archive ${name}`, 'Archive staff', <ArchiveOutlined fontSize="small" />, () =>
                  setPending({ staff, action: 'archive' }),
                )}
            {staff.status === 'LOCKED' && !staff.archived
              ? iconButton(`Unlock ${name}`, 'Unlock user', <LockOpen fontSize="small" />, () =>
                  setPending({ staff, action: 'unlock' }),
                )
              : staff.status === 'ACTIVE' &&
                !staff.archived &&
                iconButton(`Lock ${name}`, 'Lock user', <LockOutlined fontSize="small" />, () =>
                  setPending({ staff, action: 'lock' }),
                )}
          </Stack>
        );
      },
    },
  ];

  const filtered = Boolean(list.query.search || Object.values(list.query.filters).some(Boolean));
  const target = pending?.staff;
  const targetName = target ? staffName(target) : '';
  const userCard = target && (
    <Box
      sx={(t) => ({
        mt: 2,
        p: 1.5,
        borderRadius: `${t.tokens.radius.input}px`,
        border: `1px solid ${t.tokens.border.medium}`,
      })}
    >
      <LabelValueList
        dense
        labelWidth={90}
        items={[
          { label: 'Name', value: targetName },
          { label: 'Email', value: target.email },
          { label: 'Staff Type', value: target.staff_type },
          { label: 'Status', value: STAFF_STATUS_LABELS[target.status] },
        ]}
      />
    </Box>
  );
  const confirms: Record<Pending['action'], Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'>> = {
    lock: {
      title: 'Lock User',
      message: `Lock ${targetName}'s account? They won't be able to sign in until it's unlocked.`,
      confirmButtonText: 'Lock User',
      confirmButtonVariant: 'warning',
    },
    unlock: {
      title: 'Unlock User',
      message: `Unlock ${targetName}'s account? They'll be able to sign in again.`,
      confirmButtonText: 'Unlock User',
      confirmButtonVariant: 'primary',
    },
    archive: {
      title: 'Archive Staff',
      message: `Archive ${targetName}? They'll move to Archived Users and can be unarchived later.`,
      confirmButtonText: 'Archive Staff',
      confirmButtonVariant: 'warning',
    },
    unarchive: {
      title: 'Unarchive Staff',
      message: `Unarchive ${targetName}? They'll move back to the Staff List.`,
      confirmButtonText: 'Unarchive Staff',
      confirmButtonVariant: 'primary',
    },
    approve: {
      title: 'Approve Staff',
      message: `Approve ${targetName}'s profile? They'll become Active.`,
      confirmButtonText: 'Approve Staff',
      confirmButtonVariant: 'success',
    },
    reject: {
      title: 'Reject Staff',
      message: `Reject ${targetName}'s profile?`,
      confirmButtonText: 'Reject Staff',
      confirmButtonVariant: 'error',
      requireReason: {
        label: 'Reason',
        maxLength: STAFF_REASON_MAX,
        placeholder: 'Why is this profile rejected? (optional)',
      },
    },
  };

  const { tone } = theme.tokens;

  return (
    <Stack spacing={2.5}>
      {tab === 'staff' && (
        <StatsStrip
          variant="pill"
          items={[
            {
              label: 'Total Staff',
              value: summary?.total ?? 0,
              color: theme.palette.primary.main,
              tint: theme.tokens.surface.tealLight,
              icon: <Groups />,
            },
            {
              label: 'Active Staff',
              value: summary?.active ?? 0,
              color: tone.success.main,
              tint: tone.success.strongBg,
              icon: <CheckCircleOutline />,
            },
            {
              label: 'Pending Invitations',
              value: summary?.pending_invitations ?? 0,
              color: tone.warning.main,
              tint: tone.warning.strongBg,
              icon: <MarkEmailUnread />,
            },
          ]}
        />
      )}
      <FilterBar
        filters={[
          ...(tab === 'invitations'
            ? []
            : [
                {
                  id: 'status',
                  label: 'Status',
                  allLabel: 'All',
                  options: PRACTICE_STAFF_STATUSES.map((status) => ({
                    value: status,
                    label: STAFF_STATUS_LABELS[status],
                  })),
                },
              ]),
          {
            id: 'staff_type',
            label: 'Staff Type',
            allLabel: 'All',
            options: PRACTICE_STAFF_TYPES.map((type) => ({ value: type, label: type })),
          },
        ]}
        values={list.query.filters}
        onChange={list.setFilter}
        search={{
          value: list.query.search,
          onChange: list.setSearch,
          label: 'Search',
          placeholder: 'Search by name or email',
        }}
        onClear={list.clear}
        onRefresh={refresh}
        refreshing={list.loading}
      />
      <DataTable
        aria-label={TABS.find((item) => item.value === tab)?.title ?? 'Staff'}
        columns={columns}
        rows={list.rows}
        getRowId={(staff) => staff.id}
        ordering={list.query.ordering}
        onOrderingChange={list.setOrdering}
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage={
          tab === 'archived'
            ? 'No archived staff. Adjust your filters or search term.'
            : filtered
              ? 'No staff found. Try another search.'
              : tab === 'invitations'
                ? 'No invitations waiting.'
                : 'No staff yet.'
        }
        minWidth={960}
      />
      {pending && target && (
        <ConfirmDialog
          open
          {...confirms[pending.action]}
          confirmButtonLoading={busy}
          onClose={() => setPending(null)}
          onConfirm={(reason) => void act(target, pending.action, reason)}
        >
          {userCard}
        </ConfirmDialog>
      )}
    </Stack>
  );
}
