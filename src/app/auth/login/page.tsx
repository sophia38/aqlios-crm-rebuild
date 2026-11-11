'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSnackbar } from 'notistack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import ScienceOutlined from '@mui/icons-material/ScienceOutlined';
import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined';
import { PasswordField } from '@/components/forms/PasswordField';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { RETURN_TO_KEY } from '@/components/auth/AuthGate';
import { DevRoleCards } from '@/components/dev/DevRoleSwitcher';
import { authApi } from '@/lib/api/auth';
import { API_MODE } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { mockApi, type DemoPersona } from '@/lib/api/mock';
import { fetchSession } from '@/store/sessionSlice';
import { selectSession, useAppDispatch, useAppSelector } from '@/store';

const schema = Yup.object({
  email: Yup.string().trim().required('Email is required').email('Enter a valid email'),
  password: Yup.string().required('Password is required'),
});

const FEATURES = [
  { icon: EventAvailableOutlined, text: 'Patients, appointments and tickets together' },
  { icon: GroupsOutlined, text: 'Rotas, leave and HR policies for the whole team' },
  { icon: VerifiedUserOutlined, text: 'CQC compliance tracked across every practice' },
];

function takeReturnTo() {
  try {
    const value = window.sessionStorage.getItem(RETURN_TO_KEY);
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    return value && value.startsWith('/') && !value.startsWith('/auth') ? value : null;
  } catch {
    return null;
  }
}

/** Brand panel of the refined login: wordmark, headline, three feature lines and the copyright. */
function BrandPanel() {
  return (
    <Box
      component="aside"
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 5,
        px: { xs: 3, md: 7 },
        py: { xs: 3.5, md: 5 },
        background: theme.tokens.shell.login.brand,
        color: theme.tokens.shell.login.onBrand,
        // Decorative rings, bottom right.
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 520,
          height: 520,
          right: -180,
          bottom: -200,
          borderRadius: '50%',
          border: `1px solid ${theme.tokens.shell.login.ring}`,
          boxShadow: theme.tokens.shell.login.ringGlow,
          pointerEvents: 'none',
        },
      })}
    >
      {/* The wordmark is dark; shown white on the teal panel. */}
      <BrandLogo height={36} sx={{ alignSelf: 'flex-start', filter: 'brightness(0) invert(1)' }} />
      <Stack spacing={2}>
        <Typography
          component="p"
          sx={{ fontSize: { xs: 24, md: 34 }, fontWeight: 500, lineHeight: 1.25, maxWidth: 460 }}
        >
          One place for your practices, your team and your patients.
        </Typography>
        <Typography sx={(theme) => ({ fontSize: 16, maxWidth: 420, color: theme.tokens.shell.login.onBrandMuted })}>
          Public Primary Care, HR and compliance in a single workspace, built for UK general practice.
        </Typography>
        <Box
          component="ul"
          sx={{ display: { xs: 'none', md: 'grid' }, gap: 1.75, listStyle: 'none', m: 0, mt: 1, p: 0 }}
        >
          {FEATURES.map(({ icon: Icon, text }) => (
            <Box component="li" key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontSize: 15 }}>
              <Box
                aria-hidden
                sx={(theme) => ({
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: `${theme.tokens.radius.iconTile}px`,
                  bgcolor: theme.tokens.shell.login.onBrandTile,
                })}
              >
                <Icon sx={{ fontSize: 18 }} />
              </Box>
              {text}
            </Box>
          ))}
        </Box>
      </Stack>
      <Typography
        sx={(theme) => ({
          display: { xs: 'none', md: 'block' },
          fontSize: 12,
          color: theme.tokens.shell.login.onBrandFaint,
        })}
      >
        © {new Date().getFullYear()} Aqlios. All rights reserved.
      </Typography>
    </Box>
  );
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { status } = useAppSelector(selectSession);
  const [persona, setPersona] = useState<DemoPersona>('super-admin');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Already signed in: skip the form.
  useEffect(() => {
    if (status === 'idle') dispatch(fetchSession());
    if (status === 'authenticated') router.replace(takeReturnTo() ?? '/verticals');
  }, [dispatch, router, status]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    onSubmit: async ({ email, password }) => {
      setSubmitError(null);
      try {
        if (API_MODE === 'mock') await mockApi.setPersona(persona);
        await authApi.login(email.trim(), password);
        await dispatch(fetchSession());
      } catch (error) {
        setSubmitError(
          error instanceof ApiError && error.isUnauthorized
            ? 'Invalid email or password.'
            : 'Something went wrong. Please try again.',
        );
      }
    },
  });

  const fieldError = (name: 'email' | 'password') =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : undefined;

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) minmax(0, 1.1fr)' },
      }}
    >
      <BrandPanel />
      <Box
        component="main"
        sx={(theme) => ({
          display: 'grid',
          placeItems: 'center',
          px: 3,
          py: { xs: 4, md: 5 },
          bgcolor: theme.tokens.surface.authPage,
        })}
      >
        <Box
          component="form"
          noValidate
          onSubmit={formik.handleSubmit}
          aria-labelledby="login-title"
          sx={(theme) => ({
            width: '100%',
            maxWidth: 480,
            p: { xs: 2.5, sm: 4 },
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            bgcolor: 'background.paper',
            borderRadius: `${theme.tokens.radius.card}px`,
            border: `1px solid ${theme.tokens.shell.login.cardBorder}`,
            boxShadow: theme.tokens.shadow.e1,
          })}
        >
          <Box>
            <Typography id="login-title" component="h1" variant="h5" sx={{ fontWeight: 500 }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={(theme) => ({ color: theme.tokens.text.muted })}>
              {API_MODE === 'mock'
                ? 'Choose how you’re signing in today.'
                : 'Sign in with your credentials to access your dashboard.'}
            </Typography>
          </Box>
          <DevRoleCards value={persona} onChange={setPersona} />
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            {...formik.getFieldProps('email')}
            error={Boolean(fieldError('email'))}
            helperText={fieldError('email')}
            disabled={formik.isSubmitting}
          />
          <PasswordField
            label="Password"
            autoComplete="current-password"
            {...formik.getFieldProps('password')}
            error={Boolean(fieldError('password'))}
            helperText={fieldError('password')}
            disabled={formik.isSubmitting}
          />
          <Box sx={{ textAlign: 'right' }}>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() =>
                enqueueSnackbar('Password reset is handled by the 31G sign-in service. Contact your administrator.', {
                  variant: 'info',
                })
              }
              sx={{ fontSize: 14, fontWeight: 500, color: 'primary.main' }}
            >
              Forgot Password?
            </Link>
          </Box>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={formik.isSubmitting}
            sx={(theme) => ({
              height: 48,
              borderRadius: `${theme.tokens.radius.pill}px`,
              fontSize: 15,
              fontWeight: 500,
            })}
          >
            {formik.isSubmitting ? <CircularProgress size={22} color="inherit" aria-label="Logging in" /> : 'Log In'}
          </Button>
          {API_MODE === 'mock' && (
            <Typography
              variant="caption"
              component="p"
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, textAlign: 'center' }}
            >
              <ScienceOutlined sx={{ fontSize: 14 }} aria-hidden />
              Demo: use any email with the password <strong>demo</strong>.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
