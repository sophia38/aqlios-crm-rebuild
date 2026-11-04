'use client';

import { useId } from 'react';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';
import { LabelValueList, type LabelValueItem } from '@/components/data/LabelValueList';
import { StatusChip } from '@/components/data/StatusChip';
import { formatBalance, formatLeave, LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/lib/api/leave';
import type { LeaveRequest } from '@/lib/api/types';
import { leaveDate } from '../leaveFormat';
import { LeaveWarnings } from './LeaveWarnings';

/**
 * Leave Request Details (docs/practice/07-leaves-and-leaves-rota.md §1): read-only, label left and
 * value right, with only the ✕. Status, dates and the rejection reason are added for decided requests.
 */
export function LeaveDetailsDialog({ request, onClose }: { request: LeaveRequest | null; onClose: () => void }) {
  const titleId = useId();
  if (!request) return null;
  const items: LabelValueItem[] = [
    { label: 'Staff Name', value: request.staff_name },
    { label: 'Role', value: request.role_name },
    { label: 'Leave Type', value: LEAVE_TYPE_LABELS[request.leave_type] },
    { label: 'Balance', value: formatBalance(request.balance_hours, request.day_hours) },
    { label: 'Start Date', value: leaveDate(request.start_date) },
    { label: 'End Date', value: leaveDate(request.end_date) },
    { label: 'Duration', value: formatLeave(request.duration_hours, request.day_hours) },
    { label: 'Notes', value: request.notes },
    { label: 'Status', value: <StatusChip status={LEAVE_STATUS_LABELS[request.status]} variant="outlined" /> },
    { label: 'Requested', value: dayjs(request.requested_at).format('DD/MM/YYYY HH:mm') },
    ...(request.decided_by
      ? [
          {
            label: request.status === 'APPROVED' ? 'Approved By' : 'Rejected By',
            value: `${request.decided_by}, ${dayjs(request.updated_at).format('DD/MM/YYYY HH:mm')}`,
          },
        ]
      : []),
    ...(request.status === 'REJECTED' ? [{ label: 'Reason', value: request.rejection_reason ?? '' }] : []),
    ...(request.warnings.length ? [{ label: 'Warnings', value: <LeaveWarnings warnings={request.warnings} /> }] : []),
  ];

  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          sx: (theme) => ({ width: 450, maxWidth: 'calc(100% - 32px)', borderRadius: `${theme.tokens.radius.base}px` }),
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
          <Box>
            <Typography id={titleId} component="h2" variant="h6" sx={{ fontWeight: 700 }}>
              Leave Request Details
            </Typography>
            <Typography variant="body2">
              {request.staff_name} — {LEAVE_TYPE_LABELS[request.leave_type]}
            </Typography>
          </Box>
          <IconButton aria-label="Close" size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        <LabelValueList items={items} labelWidth={110} />
      </Box>
    </Dialog>
  );
}
