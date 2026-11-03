'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AssignmentInd from '@mui/icons-material/AssignmentIndOutlined';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ticketsApi } from '@/lib/api/tickets';
import type { TicketDetail } from '@/lib/api/types';
import { useAssignableStaff } from './AssignStaffModal';

/** Assign Staff Member: `Select Staff *` and Assign Task, disabled until someone new is chosen (captured). */
export function AssignStaffCard({
  practiceId,
  ticket,
  closed,
  onAssigned,
}: {
  practiceId: string;
  ticket: TicketDetail;
  closed: boolean;
  onAssigned: (ticket: TicketDetail) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const staff = useAssignableStaff(practiceId);
  const current = ticket.assigned_staff?.id ?? '';
  const [choice, setChoice] = useState(current);
  const [saving, setSaving] = useState(false);
  const value = staff?.some((member) => member.id === choice) ? choice : '';

  const assign = async () => {
    setSaving(true);
    try {
      onAssigned(await ticketsApi.assign(PUBLIC_SUB_APP_ID, practiceId, ticket.id, { staff_id: choice }));
      enqueueSnackbar('Staff assigned', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to assign staff', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSectionCard title="Assign Staff Member">
      <Stack spacing={2}>
        <TextField
          select
          fullWidth
          required
          label="Select Staff"
          value={value}
          onChange={(event) => setChoice(event.target.value)}
          disabled={closed || staff === null}
          helperText={staff && staff.length === 0 ? 'No staff are available at this practice.' : undefined}
          slotProps={{
            inputLabel: { shrink: true },
            select: {
              displayEmpty: true,
              renderValue: (selected) =>
                staff?.find((member) => member.id === selected)?.name ?? (
                  <Box component="span" sx={{ color: 'text.disabled' }}>
                    Select here
                  </Box>
                ),
            },
          }}
        >
          {(staff ?? []).map((member) => (
            <MenuItem key={member.id} value={member.id}>
              {member.name} ({member.role}){member.id === ticket.recommended_staff?.id ? ' · Recommended' : ''}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="brand"
          startIcon={<AssignmentInd />}
          onClick={assign}
          loading={saving}
          disabled={closed || !value || value === current}
        >
          Assign Task
        </Button>
      </Stack>
    </FormSectionCard>
  );
}
