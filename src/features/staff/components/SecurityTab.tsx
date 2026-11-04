'use client';

import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { PasswordField } from '@/components/forms/PasswordField';
import { ApiError } from '@/lib/api/http';
import { PASSWORD_RULE, passwordMeetsRule, staffApi } from '@/lib/api/staff';
import { anyError, fieldError, useSaveBinding, type SaveBinding } from '../staffForm';

const schema = Yup.object({
  current_password: Yup.string().required('Current Password is required'),
  new_password: Yup.string()
    .required('New Password is required')
    .test('rule', PASSWORD_RULE, (value) => !value || passwordMeetsRule(value))
    .notOneOf([Yup.ref('current_password')], 'Choose a password you have not used before'),
  confirm_password: Yup.string()
    .required('Confirm New Password is required')
    .oneOf([Yup.ref('new_password')], 'Passwords do not match'),
});

/**
 * Security (Profile only; docs/practice-user/00-practice-user-role.md): saved with the page's Save
 * Changes, as captured. The demo checks the current password ("demo") and changes nothing.
 */
export function SecurityTab({ bind }: { bind: (binding: SaveBinding | null) => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const formik = useFormik({
    initialValues: { current_password: '', new_password: '', confirm_password: '' },
    validationSchema: schema,
    onSubmit: async (values, helpers) => {
      try {
        await staffApi.changePassword({ current_password: values.current_password, new_password: values.new_password });
        helpers.resetForm();
        enqueueSnackbar('Password updated', { variant: 'success' });
      } catch (error) {
        if (error instanceof ApiError && error.code === 400 && /current password/i.test(error.message)) {
          helpers.setFieldError('current_password', error.message);
        } else {
          enqueueSnackbar('Failed to update the password', { variant: 'error' });
        }
      }
    },
  });
  useSaveBinding(formik, bind);

  const field = (name: keyof typeof formik.values, label: string, toggle: string, helper?: string) => {
    const error = fieldError(formik, name);
    return (
      <PasswordField
        fullWidth
        required
        label={label}
        toggleLabel={toggle}
        autoComplete={name === 'current_password' ? 'current-password' : 'new-password'}
        {...formik.getFieldProps(name)}
        error={Boolean(error)}
        helperText={error ?? helper}
      />
    );
  };

  return (
    <FormSectionCard
      title={
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            aria-hidden
            sx={(theme) => ({
              width: 36,
              height: 36,
              display: 'grid',
              placeItems: 'center',
              borderRadius: `${theme.tokens.radius.input}px`,
              bgcolor: theme.tokens.surface.tealLight,
              color: 'primary.main',
            })}
          >
            <LockOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography component="span" sx={{ display: 'block', fontSize: 16, fontWeight: 600 }}>
              Security
            </Typography>
            <Typography component="span" variant="body2">
              Manage your password and account protection settings.
            </Typography>
          </Box>
        </Stack>
      }
      hasError={anyError(formik, ['current_password', 'new_password', 'confirm_password'])}
    >
      <Stack spacing={2} sx={{ maxWidth: 520 }}>
        {field('current_password', 'Current Password', 'current password')}
        {field('new_password', 'New Password', 'new password', PASSWORD_RULE)}
        {field('confirm_password', 'Confirm New Password', 'confirm new password')}
      </Stack>
    </FormSectionCard>
  );
}
