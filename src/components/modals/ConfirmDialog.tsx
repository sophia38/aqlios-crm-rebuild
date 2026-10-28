'use client';

import { useEffect, useId, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import Close from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined';
import HelpOutline from '@mui/icons-material/HelpOutlineOutlined';

export type ConfirmVariant = 'error' | 'warning' | 'success' | 'primary';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  /** Tinted callout under the message (⚠, in the variant's warning/error tone). */
  warning?: React.ReactNode;
  /** Primary-tone callout suggesting a softer option (e.g. archive instead of delete). */
  alternative?: React.ReactNode;
  /** Small grey line under the title. Defaults to "This can't be undone." for Delete/Remove errors. */
  subtitle?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: ConfirmVariant;
  confirmButtonDisabled?: boolean;
  confirmButtonLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * The one confirmation dialog (design A in docs/practice/09-confirmation-popups.md), with the
 * approved fixes: focus starts on Cancel, Enter does not confirm, and "This can't be undone."
 * is never repeated in both the subtitle and the message.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  warning,
  alternative,
  subtitle,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  confirmButtonVariant = 'error',
  confirmButtonDisabled = false,
  confirmButtonLoading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  const color = {
    error: theme.tokens.tone.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    primary: theme.palette.primary.main,
  }[confirmButtonVariant];

  const isDestructive = confirmButtonVariant === 'error' && /^(delete|remove)\b/i.test(confirmButtonText);
  const resolvedSubtitle = subtitle ?? (isDestructive ? "This can't be undone." : undefined);
  const Icon =
    confirmButtonVariant === 'success'
      ? CheckCircleOutline
      : confirmButtonVariant === 'primary'
        ? HelpOutline
        : ErrorOutline;

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => cancelRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  const close = () => {
    if (!confirmButtonLoading) onClose();
  };

  const callout = (content: React.ReactNode, tone: string, icon: React.ReactNode) => (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        mt: 2,
        p: 1.5,
        borderRadius: `${theme.tokens.radius.input}px`,
        bgcolor: alpha(tone, 0.08),
        color: tone,
        alignItems: 'flex-start',
        fontSize: 14,
        '& svg': { fontSize: 18, mt: '2px' },
      }}
    >
      {icon}
      <Box>{content}</Box>
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: { width: 520, maxWidth: 'calc(100% - 32px)', m: 2, borderRadius: '24px', border: 'none' },
        },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 3, pt: 3, pb: 2 }}>
        <Box
          aria-hidden
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '10px',
            bgcolor: alpha(color, 0.1),
            color,
          }}
        >
          <Icon fontSize="small" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id={titleId} component="h2" sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          {resolvedSubtitle && <Typography variant="caption">{resolvedSubtitle}</Typography>}
        </Box>
        <IconButton
          aria-label="Close"
          onClick={close}
          disabled={confirmButtonLoading}
          sx={{ width: 32, height: 32, borderRadius: '16px', bgcolor: theme.tokens.neutral[100] }}
        >
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
      <Divider />
      <Box sx={{ px: 3, py: 2.5 }}>
        <Typography id={messageId} component="div" sx={{ fontSize: 15, color: 'text.primary' }}>
          {message}
        </Typography>
        {warning &&
          callout(
            warning,
            confirmButtonVariant === 'warning' ? theme.palette.warning.main : theme.tokens.tone.error.main,
            <ErrorOutline />,
          )}
        {alternative && callout(alternative, theme.palette.primary.main, <ArchiveOutlined />)}
      </Box>
      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ px: 3, py: 2, justifyContent: 'flex-end' }}>
        <Button
          ref={cancelRef}
          variant="outlined"
          onClick={close}
          disabled={confirmButtonLoading}
          sx={{
            borderRadius: '24px',
            bgcolor: 'background.paper',
            color: theme.tokens.neutral[900],
            borderColor: theme.tokens.border.bold,
          }}
        >
          {cancelButtonText}
        </Button>
        <Button
          variant="contained"
          loading={confirmButtonLoading}
          disabled={confirmButtonDisabled}
          onClick={onConfirm}
          startIcon={isDestructive ? <DeleteOutline /> : undefined}
          sx={{
            borderRadius: '24px',
            bgcolor: color,
            color: theme.palette.getContrastText(color),
            '&:hover': { bgcolor: alpha(color, 0.88) },
          }}
        >
          {confirmButtonText}
        </Button>
      </Stack>
    </Dialog>
  );
}
