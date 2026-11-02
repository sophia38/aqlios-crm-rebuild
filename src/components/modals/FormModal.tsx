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
  /** `md` 600px (default, Create Rota Group) · `lg` 900px (Move to Standard) · `xl` near full width (template popup). */
  size?: 'md' | 'lg' | 'xl';
  /** Tinted icon tile before the title. */
  icon?: React.ReactNode;
  /** Shown next to the title, e.g. a "Standard Template" chip. */
  titleAdornment?: React.ReactNode;
  /** Replaces the Cancel + submit pair; rendered in a sticky footer with a divider above. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const WIDTHS = { md: 600, lg: 900, xl: 1100 } as const;

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
  size = 'md',
  icon,
  titleAdornment,
  footer,
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
          sx: (theme) => ({
            width: WIDTHS[size],
            maxWidth: 'calc(100% - 32px)',
            m: 2,
            borderRadius: size === 'md' ? '16px' : `${theme.tokens.radius.base}px`,
            border: 'none',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          }),
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
        sx={{ p: 3, pb: footer ? 0 : 3 }}
      >
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            {icon && (
              <Box
                aria-hidden
                sx={(theme) => ({
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: `${theme.tokens.radius.input}px`,
                  bgcolor: theme.tokens.tone.success.strongBg,
                  color: theme.tokens.tone.success.main,
                })}
              >
                {icon}
              </Box>
            )}
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
                <Typography id={titleId} component="h2" sx={{ fontSize: 20, fontWeight: 600, color: 'text.primary' }}>
                  {title}
                </Typography>
                {titleAdornment}
              </Stack>
              {icon && subtitle && <Typography variant="body2">{subtitle}</Typography>}
            </Box>
          </Stack>
          <IconButton aria-label="Close" onClick={close} disabled={submitting} size="small" sx={{ mt: -0.5 }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        {subtitle && !icon && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        {icon && <Box sx={{ mb: 3 }} />}
        <Stack spacing={2.5}>{children}</Stack>
        {footer ? (
          <Box
            sx={(theme) => ({
              position: 'sticky',
              bottom: 0,
              zIndex: 1,
              mt: 3,
              mx: -3,
              px: 3,
              py: 2,
              bgcolor: 'background.paper',
              borderTop: `1px solid ${theme.tokens.border.medium}`,
            })}
          >
            {footer}
          </Box>
        ) : (
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
        )}
      </Box>
    </Dialog>
  );
}
