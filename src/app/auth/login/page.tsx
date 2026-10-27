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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { BrandLogo } from '@/components/primitives/BrandLogo';
import { RETURN_TO_KEY } from '@/components/auth/AuthGate';
import { DevRoleSwitcherSelect } from '@/components/dev/DevRoleSwitcher';
import { authApi } from '@/lib/api/auth';
import { API_MODE } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { mockApi, type DemoPersona } from '@/lib/api/mock';
import { asset } from '@/lib/basePath';
import { fetchSession } from '@/store/sessionSlice';
import { selectSession, useAppDispatch, useAppSelector } from '@/store';

const schema = Yup.object({
  email: Yup.string().trim().required('Email is required').email('Enter a valid email'),
  password: Yup.string().required('Password is required'),
});

function takeReturnTo() {
  try {
    const value = window.sessionStorage.getItem(RETURN_TO_KEY);
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    return value && value.startsWith('/') && !value.startsWith('/auth') ? value : null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { status } = useAppSelector(selectSession);
  const [showPassword, setShowPassword] = useState(false);
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
      component="main"
      sx={(theme) => ({
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: theme.tokens.surface.authPage,
        backgroundImage: `url(${asset('/auth/auth_watermark.svg')})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'min(520px, 80vw) auto',
      })}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          width: '100%',
          maxWidth: 880,
          p: { xs: 3, md: 6 },
          border: 'none',
          boxShadow: theme.tokens.shadow.card,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 370px' },
          gap: { xs: 4, md: 6 },
          alignItems: 'center',
        })}
      >
        <Box>
          <BrandLogo height={48} sx={{ mb: 3 }} />
          <Typography component="h1" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 600, lineHeight: 1.2, mb: 1 }}>
            Portal Login
          </Typography>
          <Typography sx={(theme) => ({ fontSize: 16, color: theme.tokens.text.muted })}>
            Sign in with your credentials to access your dashboard.
          </Typography>
        </Box>

        <Box component="form" noValidate onSubmit={formik.handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              {...formik.getFieldProps('email')}
              error={Boolean(fieldError('email'))}
              helperText={fieldError('email')}
              disabled={formik.isSubmitting}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...formik.getFieldProps('password')}
              error={Boolean(fieldError('password'))}
              helperText={fieldError('password')}
              disabled={formik.isSubmitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((value) => !value)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
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
                sx={{ fontSize: 14, color: 'brand.main' }}
              >
                Forgot Password?
              </Link>
            </Box>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <Button
              type="submit"
              variant="contained"
              color="brand"
              fullWidth
              disabled={formik.isSubmitting}
              sx={(theme) => ({
                height: 48,
                borderRadius: `${theme.tokens.radius.loginButton}px`,
                fontSize: 15,
                fontWeight: 500,
              })}
            >
              {formik.isSubmitting ? <CircularProgress size={22} color="inherit" aria-label="Logging in" /> : 'Log In'}
            </Button>
            {API_MODE === 'mock' && (
              <Box
                sx={(theme) => ({
                  p: 2,
                  borderRadius: `${theme.tokens.radius.input}px`,
                  bgcolor: theme.tokens.surface.subtleFill,
                  border: `1px dashed ${theme.tokens.border.bold}`,
                })}
              >
                <Typography variant="caption" component="p" sx={{ mb: 1.5 }}>
                  Demo: use any email with the password <strong>demo</strong>.
                </Typography>
                <DevRoleSwitcherSelect value={persona} onChange={setPersona} />
              </Box>
            )}
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
