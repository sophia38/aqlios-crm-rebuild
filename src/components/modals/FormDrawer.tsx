'use client';

import { useId } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';

export interface FormDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitDisabled?: boolean;
  submitting?: boolean;
  children: React.ReactNode;
}

/**
 * Right-side drawer form: 480px, labels above fields, sticky Cancel and Save footer
 * (reference: Add Competency, docs/super-admin/09-settings.md).
 */
export function FormDrawer({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel,
  submitDisabled = false,
  submitting = false,
  children,
}: FormDrawerProps) {
  const titleId = useId();
  const close = () => {
    if (!submitting) onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={close}
      slotProps={{
        paper: {
          'aria-labelledby': titleId,
          sx: { width: 480, maxWidth: '100%', borderTopLeftRadius: 18, borderBottomLeftRadius: 18, border: 'none' },
        },
      }}
    >
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!submitDisabled && !submitting) onSubmit();
        }}
        sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5 }}>
          <Typography id={titleId} component="h2" sx={{ fontSize: 20, fontWeight: 700 }}>
            {title}
          </Typography>
          <IconButton aria-label="Close" onClick={close} disabled={submitting} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5 }}>
          {subtitle && (
            <Typography variant="body2" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
          )}
          <Stack spacing={2.5}>{children}</Stack>
        </Box>
        <Divider />
        <Stack direction="row" spacing={2} sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={close}
            disabled={submitting}
            sx={(theme) => ({
              borderRadius: `${theme.tokens.radius.pill}px`,
              color: 'brand.contrastText',
              borderColor: 'brand.main',
            })}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="brand"
            disabled={submitDisabled || submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Check />}
            sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
          >
            {submitLabel}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

/** Bold label above a field with a red asterisk, as in the drawer forms (no floating labels there). */
export function FieldLabel({ htmlFor, required, children }: { htmlFor: string; required?: boolean; children: string }) {
  return (
    <Typography component="label" htmlFor={htmlFor} sx={{ display: 'block', fontSize: 14, fontWeight: 600, mb: 0.75 }}>
      {children}
      {required && (
        <Box component="span" aria-hidden sx={(theme) => ({ color: theme.tokens.text.asterisk, ml: 0.25 })}>
          *
        </Box>
      )}
    </Typography>
  );
}
