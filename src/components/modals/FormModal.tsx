'use client';

import { useId } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';

export interface FormModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  /** Keep disabled until the form is valid (live behaviour). */
  submitDisabled?: boolean;
  submitting?: boolean;
  cancelLabel?: string;
  children: React.ReactNode;
}

/**
 * Standard dialog form: 600px, 16px radius, title with ✕, intro, fields, Cancel and submit
 * (reference: Create Rota Group, docs/super-admin/06-rota-management.md). Esc and ✕ close it
 * without a "discard changes?" prompt, as in the live app.
 */
export function FormModal({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel,
  submitIcon,
  submitDisabled = false,
  submitting = false,
  cancelLabel = 'Cancel',
  children,
}: FormModalProps) {
  const titleId = useId();
  const close = () => {
    if (!submitting) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby={titleId}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width: 600,
            maxWidth: 'calc(100% - 32px)',
            m: 2,
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          },
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
        sx={{ p: 3 }}
      >
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
          <Typography id={titleId} component="h2" sx={{ fontSize: 20, fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
          <IconButton aria-label="Close" onClick={close} disabled={submitting} size="small" sx={{ mt: -0.5 }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        {subtitle && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        <Stack spacing={2.5}>{children}</Stack>
        <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={close}
            disabled={submitting}
            sx={(theme) => ({
              height: 48,
              borderRadius: '100px',
              borderColor: theme.tokens.neutral[300],
              color: theme.tokens.neutral[500],
            })}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitDisabled || submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : submitIcon}
            sx={(theme) => ({
              height: 48,
              borderRadius: '100px',
              '&.Mui-disabled': { bgcolor: theme.tokens.neutral[200], color: theme.tokens.neutral[400] },
            })}
          >
            {submitLabel}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
