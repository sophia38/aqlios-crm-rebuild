'use client';

import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import PublishedWithChanges from '@mui/icons-material/PublishedWithChangesOutlined';
import { FormModal } from '@/components/modals/FormModal';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TICKET_REASON_MAX, TICKET_STATUS_LABELS, ticketsApi } from '@/lib/api/tickets';
import { TICKET_CLOSURE_REASONS, TICKET_OPEN_STATUSES, type TicketDetail, type TicketStatus } from '@/lib/api/types';

interface Values {
  status: TicketStatus | '';
  reason: string;
  other: string;
}

const schema = Yup.object({
  status: Yup.string().required('Status is required'),
  reason: Yup.string().when('status', {
    is: 'CLOSED',
    then: (field) => field.required('Reason for closure is required'),
  }),
  other: Yup.string().when(['status', 'reason'], {
    is: (status: string, reason: string) => status === 'CLOSED' && reason === 'Other',
    then: (field) =>
      field
        .trim()
        .required('Details are required')
        .max(TICKET_REASON_MAX, `Details must be ${TICKET_REASON_MAX} characters or fewer`),
  }),
});

/** Update Status: a Status select; Closed adds a required Reason for Closure (plan §2b). */
export function UpdateStatusModal({
  open,
  practiceId,
  ticket,
  onClose,
  onSaved,
}: {
  open: boolean;
  practiceId: string;
  ticket: TicketDetail;
  onClose: () => void;
  onSaved: (ticket: TicketDetail) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const statuses: TicketStatus[] = [...TICKET_OPEN_STATUSES.filter((status) => status !== ticket.status), 'CLOSED'];

  return (
    <Formik<Values>
      key={open ? 'open' : 'closed'}
      initialValues={{ status: '', reason: '', other: '' }}
      validationSchema={schema}
      validateOnMount
      onSubmit={async (values) => {
        const reason = values.reason === 'Other' ? values.other.trim() : values.reason;
        try {
          const saved = await ticketsApi.updateStatus(PUBLIC_SUB_APP_ID, practiceId, ticket.id, {
            status: values.status as TicketStatus,
            reason: values.status === 'CLOSED' ? reason : undefined,
          });
          enqueueSnackbar(values.status === 'CLOSED' ? 'Case closed' : 'Status updated', { variant: 'success' });
          onSaved(saved);
        } catch {
          enqueueSnackbar('Failed to update the status', { variant: 'error' });
        }
      }}
    >
      {(formik) => (
        <FormModal
          open={open}
          title="Update Status"
          subtitle={`Current status: ${TICKET_STATUS_LABELS[ticket.status]}.`}
          onClose={onClose}
          onSubmit={formik.submitForm}
          submitLabel={formik.values.status === 'CLOSED' ? 'Close Case' : 'Update Status'}
          submitIcon={<PublishedWithChanges />}
          submitDisabled={!formik.isValid}
          submitting={formik.isSubmitting}
        >
          <TextField
            select
            fullWidth
            required
            label="Status"
            {...formik.getFieldProps('status')}
            error={formik.touched.status && Boolean(formik.errors.status)}
            helperText={formik.touched.status && formik.errors.status}
          >
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status === 'CLOSED' ? 'Closed' : TICKET_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
          {formik.values.status === 'CLOSED' && (
            <TextField
              select
              fullWidth
              required
              label="Reason for Closure"
              {...formik.getFieldProps('reason')}
              error={formik.touched.reason && Boolean(formik.errors.reason)}
              helperText={formik.touched.reason && formik.errors.reason}
            >
              {TICKET_CLOSURE_REASONS.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </TextField>
          )}
          {formik.values.status === 'CLOSED' && formik.values.reason === 'Other' && (
            <TextField
              fullWidth
              required
              multiline
              minRows={3}
              label="Details"
              placeholder="Why is this case being closed?"
              {...formik.getFieldProps('other')}
              error={formik.touched.other && Boolean(formik.errors.other)}
              helperText={
                (formik.touched.other && formik.errors.other) ||
                `${formik.values.other.length}/${TICKET_REASON_MAX} characters`
              }
              slotProps={{ htmlInput: { maxLength: TICKET_REASON_MAX } }}
            />
          )}
        </FormModal>
      )}
    </Formik>
  );
}
