'use client';

import { useEffect, useState } from 'react';
import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Send from '@mui/icons-material/SendOutlined';
import { FormModal } from '@/components/modals/FormModal';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { staffApi } from '@/lib/api/staff';
import { PRACTICE_STAFF_TYPES, type PracticeStaffType, type Role } from '@/lib/api/types';

const schema = Yup.object({
  first_name: Yup.string().trim().max(50, 'First Name must be 50 characters or fewer'),
  last_name: Yup.string().trim().max(50, 'Last Name must be 50 characters or fewer'),
  email: Yup.string().trim().required('Email is required').email('Enter a valid email'),
  role_id: Yup.string().required('Role is required'),
  staff_type: Yup.string().required('Staff Type is required'),
});

/** The roles staff can be invited to (a practice-scoped list, so practice users can invite too). */
export function useRoles() {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [roles, setRoles] = useState<Pick<Role, 'id' | 'name'>[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    staffApi
      .roles(PUBLIC_SUB_APP_ID, practice.id, controller.signal)
      .then(setRoles)
      .catch(() => {
        if (controller.signal.aborted) return;
        setRoles([]);
        enqueueSnackbar('Failed to load roles', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practice.id, enqueueSnackbar]);
  return roles;
}

/**
 * Send Invite (docs/practice/05-staff-onboarding.md §4). Fixes: Email is marked required, and the
 * submit button says Send Invite (live: "Sync with Clinical System").
 */
export function InviteStaffModal({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const roles = useRoles();

  return (
    <Formik
      key={open ? 'open' : 'closed'}
      initialValues={{ first_name: '', last_name: '', email: '', role_id: '', staff_type: '' }}
      validationSchema={schema}
      validateOnMount
      onSubmit={async (values, helpers) => {
        try {
          await staffApi.invite(PUBLIC_SUB_APP_ID, practice.id, {
            ...values,
            email: values.email.trim(),
            staff_type: values.staff_type as PracticeStaffType,
          });
          enqueueSnackbar('Invitation sent', { variant: 'success' });
          onInvited();
        } catch (error) {
          if (error instanceof ApiError && error.code === 400 && /email/i.test(error.message)) {
            helpers.setFieldError('email', error.message);
          } else {
            enqueueSnackbar('Failed to send the invitation', { variant: 'error' });
          }
        }
      }}
    >
      {(formik) => {
        const fieldError = (name: keyof typeof formik.values) =>
          formik.touched[name] && formik.errors[name] ? formik.errors[name] : undefined;
        return (
          <FormModal
            open={open}
            title="Send Invite"
            subtitle="Invitation will be sent on the email to join the team."
            onClose={onClose}
            onSubmit={formik.submitForm}
            submitLabel="Send Invite"
            submitIcon={<Send />}
            submitDisabled={!formik.isValid}
            submitting={formik.isSubmitting}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  {...formik.getFieldProps('first_name')}
                  error={Boolean(fieldError('first_name'))}
                  helperText={fieldError('first_name')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Last Name"
                  {...formik.getFieldProps('last_name')}
                  error={Boolean(fieldError('last_name'))}
                  helperText={fieldError('last_name')}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  required
                  type="email"
                  label="Email"
                  {...formik.getFieldProps('email')}
                  error={Boolean(fieldError('email'))}
                  helperText={fieldError('email')}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Role"
                  {...formik.getFieldProps('role_id')}
                  error={Boolean(fieldError('role_id'))}
                  helperText={fieldError('role_id')}
                  disabled={roles === null}
                  slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                >
                  <MenuItem value="" disabled>
                    Select role
                  </MenuItem>
                  {(roles ?? []).map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Staff Type"
                  {...formik.getFieldProps('staff_type')}
                  error={Boolean(fieldError('staff_type'))}
                  helperText={fieldError('staff_type')}
                  slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                >
                  <MenuItem value="" disabled>
                    Select staff type
                  </MenuItem>
                  {PRACTICE_STAFF_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </FormModal>
        );
      }}
    </Formik>
  );
}
