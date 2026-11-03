'use client';

import { useEffect, useState } from 'react';
import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import PersonAddAlt from '@mui/icons-material/PersonAddAltOutlined';
import { FormModal } from '@/components/modals/FormModal';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TICKET_REASON_MAX, ticketsApi } from '@/lib/api/tickets';
import type { Ticket, TicketDetail, TicketStaff } from '@/lib/api/types';

const schema = Yup.object({
  staff_id: Yup.string().required('Staff is required'),
  reason: Yup.string().max(TICKET_REASON_MAX, `Reason must be ${TICKET_REASON_MAX} characters or fewer`),
});

/** Loads the practice staff who can take a ticket (active members of the practice). */
export function useAssignableStaff(practiceId: string, enabled = true) {
  const { enqueueSnackbar } = useSnackbar();
  const [staff, setStaff] = useState<TicketStaff[] | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    ticketsApi
      .assignableStaff(PUBLIC_SUB_APP_ID, practiceId, controller.signal)
      .then(setStaff)
      .catch(() => {
        if (controller.signal.aborted) return;
        setStaff([]);
        enqueueSnackbar('Failed to load staff', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, enabled, enqueueSnackbar]);
  return staff;
}

/** Assign to Alternative Staff: a required Staff select and an optional Reason (plan §2a). */
export function AssignStaffModal({
  practiceId,
  ticket,
  onClose,
  onAssigned,
}: {
  practiceId: string;
  ticket: Ticket | null;
  onClose: () => void;
  onAssigned: (ticket: TicketDetail) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const staff = useAssignableStaff(practiceId, ticket !== null);
  const options = (staff ?? []).filter((member) => member.id !== ticket?.recommended_staff?.id);

  return (
    <Formik
      key={ticket?.id ?? 'closed'}
      initialValues={{ staff_id: '', reason: '' }}
      validationSchema={schema}
      validateOnMount
      onSubmit={async (values) => {
        if (!ticket) return;
        try {
          const saved = await ticketsApi.assign(PUBLIC_SUB_APP_ID, practiceId, ticket.id, {
            staff_id: values.staff_id,
            reason: values.reason.trim() || undefined,
          });
          enqueueSnackbar('Staff assigned', { variant: 'success' });
          onAssigned(saved);
        } catch {
          enqueueSnackbar('Failed to assign staff', { variant: 'error' });
        }
      }}
    >
      {(formik) => (
        <FormModal
          open={ticket !== null}
          title="Assign to Alternative Staff"
          subtitle={ticket ? `Choose who should take ${ticket.patient_name}'s consultation.` : undefined}
          onClose={onClose}
          onSubmit={formik.submitForm}
          submitLabel="Assign Staff"
          submitIcon={<PersonAddAlt />}
          submitDisabled={!formik.isValid}
          submitting={formik.isSubmitting}
        >
          <TextField
            select
            fullWidth
            required
            label="Staff"
            {...formik.getFieldProps('staff_id')}
            error={formik.touched.staff_id && Boolean(formik.errors.staff_id)}
            helperText={
              (formik.touched.staff_id && formik.errors.staff_id) ||
              (staff && options.length === 0 ? 'No other staff are available at this practice.' : undefined)
            }
            disabled={staff === null}
          >
            {options.map((member) => (
              <MenuItem key={member.id} value={member.id}>
                {member.name} ({member.role})
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            placeholder="Why is someone else taking this consultation? (optional)"
            {...formik.getFieldProps('reason')}
            error={Boolean(formik.errors.reason)}
            helperText={formik.errors.reason || `${formik.values.reason.length}/${TICKET_REASON_MAX} characters`}
            slotProps={{ htmlInput: { maxLength: TICKET_REASON_MAX } }}
          />
        </FormModal>
      )}
    </Formik>
  );
}
