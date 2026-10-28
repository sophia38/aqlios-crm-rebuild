'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFormikContext } from 'formik';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import { HubManagementLayout, type Crumb } from '@/components/layout/HubManagementLayout';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { focusFirstError } from './formHelpers';

export const PRACTICE_LIST_HREF = '/verticals/public/hub-management/practices';

/** After a submit with errors, scroll to the first one (Formik doesn't call onSubmit when invalid). */
function FocusFirstErrorOnSubmit() {
  const { submitCount, isValid, isSubmitting } = useFormikContext();
  const handled = useRef(0);
  useEffect(() => {
    if (submitCount > handled.current && !isSubmitting) {
      handled.current = submitCount;
      if (!isValid) focusFirstError();
    }
  }, [isSubmitting, isValid, submitCount]);
  return null;
}

/**
 * Page frame for the practice forms: breadcrumb, panel, centred column with Go Back, header and
 * Save Changes top right (reference form layout, CLAUDE.md §3).
 */
export function PracticeFormFrame({
  crumbs,
  subtitle,
  children,
}: {
  crumbs: Crumb[];
  subtitle: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { handleSubmit, isSubmitting } = useFormikContext();

  return (
    <HubManagementLayout hubManagementBreadcrumbs={crumbs}>
      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ maxWidth: 980, mx: 'auto' }}>
        <FocusFirstErrorOnSubmit />
        <GoBackLink onClick={() => router.push(PRACTICE_LIST_HREF)} />
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between', my: 2.5 }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <ApartmentOutlined aria-hidden sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box>
              <Typography component="h1" variant="pageTitle">
                Practice Information
              </Typography>
              <Typography variant="body2">{subtitle}</Typography>
            </Box>
          </Stack>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, height: 42, px: 3, flexShrink: 0 })}
          >
            Save Changes
          </Button>
        </Stack>
        {children}
      </Box>
    </HubManagementLayout>
  );
}
