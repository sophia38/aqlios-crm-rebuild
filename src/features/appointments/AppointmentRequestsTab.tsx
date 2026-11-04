'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import HourglassEmpty from '@mui/icons-material/HourglassEmptyOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatsStrip } from '@/components/data/StatsStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useCurrentPractice, usePracticeHref } from '@/features/practice/PracticeContext';
import { useAssignableStaff } from '@/features/tickets/components/AssignStaffModal';
import {
  APPOINTMENT_REASON_MAX,
  APPOINTMENT_REQUEST_RANGE_LABELS,
  APPOINTMENT_REQUEST_STATUS_LABELS,
  appointmentsApi,
} from '@/lib/api/appointments';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type {
  AppointmentRequest,
  AppointmentRequestListParams,
  AppointmentRequestRange,
  AppointmentRequestStatus,
  AppointmentRequestSummary,
} from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { expiresIn } from './appointmentFormat';
import { appointmentConsultationPath } from './appointmentRoutes';

/**
 * Appointment Requests (docs/practice/03-appointment.md, plan §3): requests to book a staff member
 * other than the recommended one. Pending rows can be approved or rejected; the patient name and 👁
 * open Consultation Details under the appointment route (captured 2026-11-03).
 */
export function AppointmentRequestsTab() {
  const theme = useTheme();
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  const staff = useAssignableStaff(practice.id);
  const [summary, setSummary] = useState<AppointmentRequestSummary | null>(null);
  const [summaryKey, setSummaryKey] = useState(0);
  const [deciding, setDeciding] = useState<{ request: AppointmentRequest; action: 'approve' | 'reject' } | null>(null);
  const [busy, setBusy] = useState(false);

  const fetcher = useCallback<PagedFetcher<AppointmentRequest>>(
    (params, signal) =>
      appointmentsApi.listRequests(PUBLIC_SUB_APP_ID, practice.id, params as AppointmentRequestListParams, signal),
    [practice.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    errorText: 'Could not load appointment requests.',
    errorToast: 'Failed to load appointment requests',
  });

  useEffect(() => {
    const controller = new AbortController();
    appointmentsApi
      .requestSummary(PUBLIC_SUB_APP_ID, practice.id, controller.signal)
      .then(setSummary)
      .catch(() => {
        if (!controller.signal.aborted) enqueueSnackbar('Failed to load request totals', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practice.id, summaryKey, enqueueSnackbar]);

  const decide = async (reason?: string) => {
    if (!deciding) return;
    const { request, action } = deciding;
    setBusy(true);
    try {
      if (action === 'approve') await appointmentsApi.approveRequest(PUBLIC_SUB_APP_ID, practice.id, request.id);
      else await appointmentsApi.rejectRequest(PUBLIC_SUB_APP_ID, practice.id, request.id, reason || undefined);
      enqueueSnackbar(action === 'approve' ? 'Request approved' : 'Request rejected', { variant: 'success' });
      setDeciding(null);
      list.reload();
      setSummaryKey((key) => key + 1);
    } catch {
      enqueueSnackbar(action === 'approve' ? 'Failed to approve the request' : 'Failed to reject the request', {
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const staffCell = (name: string, role: string) => (
    <Box sx={{ minWidth: 100 }}>
      {name}
      <Box component="span" sx={{ display: 'block', fontSize: 12, color: 'text.secondary' }}>
        {role}
      </Box>
    </Box>
  );

  const caseHref = (request: AppointmentRequest) => practiceHref(appointmentConsultationPath(request.consultation_id));

  const columns: DataTableColumn<AppointmentRequest>[] = [
    {
      id: 'patient',
      label: 'Patient Name',
      render: (request) => (
        <Box
          component={Link}
          href={caseHref(request)}
          sx={{ color: 'text.primary', fontWeight: 500, whiteSpace: 'nowrap' }}
        >
          {request.patient_name}
        </Box>
      ),
    },
    {
      id: 'original',
      label: 'Original Recommendation',
      render: (request) => staffCell(request.original_staff.name, request.original_staff.role),
    },
    {
      id: 'requested',
      label: 'Requested Alternative',
      render: (request) => staffCell(request.requested_staff.name, request.requested_staff.role),
    },
    {
      id: 'reason',
      label: 'Reason',
      render: (request) => <Box sx={{ minWidth: 160, maxWidth: 220 }}>{request.reason}</Box>,
    },
    {
      id: 'by',
      label: 'Requested By',
      render: (request) => <Box sx={{ whiteSpace: 'nowrap' }}>{request.requested_by.name}</Box>,
    },
    {
      id: 'expires',
      label: 'Expires in',
      render: (request) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>{request.status === 'PENDING' ? expiresIn(request.expires_at) : '-'}</Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (request) => <StatusChip status={APPOINTMENT_REQUEST_STATUS_LABELS[request.status]} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (request) => (
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
          <Tooltip title="View case">
            <IconButton
              component={Link}
              href={caseHref(request)}
              aria-label={`View case for ${request.patient_name}`}
              size="small"
              sx={{ color: 'primary.main' }}
            >
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          {request.status === 'PENDING' && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  aria-label={`Approve request for ${request.patient_name}`}
                  size="small"
                  onClick={() => setDeciding({ request, action: 'approve' })}
                  sx={{ color: theme.tokens.tone.success.main }}
                >
                  <CheckCircleOutline fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  aria-label={`Reject request for ${request.patient_name}`}
                  size="small"
                  onClick={() => setDeciding({ request, action: 'reject' })}
                  sx={{ color: theme.tokens.tone.error.main }}
                >
                  <CancelOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Stack>
      ),
    },
  ];

  const filtered = Object.values(list.query.filters).some(Boolean);
  const target = deciding?.request;
  const { tone } = theme.tokens;

  return (
    <Stack spacing={2.5}>
      <StatsStrip
        variant="pill"
        items={[
          {
            label: 'Pending Approval',
            value: summary?.pending ?? 0,
            color: tone.warning.main,
            tint: tone.warning.strongBg,
            icon: <HourglassEmpty />,
          },
          {
            label: 'Approved Today',
            value: summary?.approved_today ?? 0,
            color: tone.success.main,
            tint: tone.success.strongBg,
            icon: <CheckCircleOutline />,
          },
          {
            label: 'Rejected Today',
            value: summary?.rejected_today ?? 0,
            color: tone.error.main,
            tint: tone.error.strongBg,
            icon: <CancelOutlined />,
          },
        ]}
      />
      <FilterBar
        filters={[
          {
            id: 'requested_by',
            label: 'Requested By',
            allLabel: 'All Staff',
            options: (staff ?? []).map((member) => ({ value: member.id, label: member.name })),
          },
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All Status',
            options: (Object.keys(APPOINTMENT_REQUEST_STATUS_LABELS) as AppointmentRequestStatus[]).map((status) => ({
              value: status,
              label: APPOINTMENT_REQUEST_STATUS_LABELS[status],
            })),
          },
          {
            id: 'range',
            label: 'Date Range',
            allLabel: 'All dates',
            options: (Object.keys(APPOINTMENT_REQUEST_RANGE_LABELS) as AppointmentRequestRange[]).map((range) => ({
              value: range,
              label: APPOINTMENT_REQUEST_RANGE_LABELS[range],
            })),
          },
        ]}
        values={list.query.filters}
        onChange={list.setFilter}
        onClear={list.clear}
      />
      <DataTable
        aria-label="Appointment requests"
        columns={columns}
        rows={list.rows}
        getRowId={(request) => request.id}
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage={filtered ? 'No requests found. Try another search.' : 'No appointment requests yet.'}
        minWidth={1000}
      />
      {deciding && target && (
        <ConfirmDialog
          open
          title={deciding.action === 'approve' ? 'Approve Request' : 'Reject Request'}
          message={
            deciding.action === 'approve'
              ? `Book ${target.patient_name} with ${target.requested_staff.name} instead of ${target.original_staff.name}?`
              : `Reject the request to book ${target.patient_name} with ${target.requested_staff.name}? ${target.original_staff.name} stays recommended.`
          }
          confirmButtonText={deciding.action === 'approve' ? 'Approve Request' : 'Reject Request'}
          confirmButtonVariant={deciding.action === 'approve' ? 'success' : 'error'}
          requireReason={
            deciding.action === 'reject'
              ? {
                  label: 'Reason',
                  maxLength: APPOINTMENT_REASON_MAX,
                  placeholder: 'Why is this request rejected? (optional)',
                }
              : undefined
          }
          confirmButtonLoading={busy}
          onClose={() => setDeciding(null)}
          onConfirm={decide}
        />
      )}
    </Stack>
  );
}
