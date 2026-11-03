'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import Close from '@mui/icons-material/Close';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutlineOutlined';
import HelpOutline from '@mui/icons-material/HelpOutlineOutlined';

export type ConfirmVariant = 'error' | 'warning' | 'success' | 'primary' | 'brand';

export interface ConfirmReason {
  label: string;
  maxLength: number;
  /** Required reasons keep the confirm button disabled until text is entered. */
  required?: boolean;
  placeholder?: string;
}

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
  /** Extra content under the callouts, e.g. Delete Role's per-user reassign cards. */
  children?: React.ReactNode;
  /** A reason text box under the message (cancel appointment, reject leave, deregister). */
  requireReason?: ConfirmReason;
  onClose: () => void;
  /** Receives the trimmed reason when `requireReason` is set. */
  onConfirm: (reason?: string) => void;
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
  children,
  requireReason,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const theme = useTheme();
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [reason, setReason] = useState('');
  const [wasOpen, setWasOpen] = useState(open);

  // Each opening starts with an empty reason.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setReason('');
  }
  const reasonMissing = Boolean(requireReason?.required) && !reason.trim();

  const color = {
    error: theme.tokens.tone.error.main,
    warning: theme.palette.warning.main,
    success: theme.palette.success.main,
    primary: theme.palette.primary.main,
    brand: theme.palette.brand.main,
  }[confirmButtonVariant];
  const ink =
    confirmButtonVariant === 'brand' ? theme.palette.brand.contrastText : theme.palette.getContrastText(color);

  const isDestructive = confirmButtonVariant === 'error' && /^(delete|remove)\b/i.test(confirmButtonText);
  const resolvedSubtitle = subtitle ?? (isDestructive ? "This can't be undone." : undefined);
  const Icon =
    confirmButtonVariant === 'success'
      ? CheckCircleOutline
      : confirmButtonVariant === 'primary' || confirmButtonVariant === 'brand'
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
        {children}
        {requireReason && (
          <TextField
            label={requireReason.label}
            required={requireReason.required}
            placeholder={requireReason.placeholder}
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, requireReason.maxLength))}
            multiline
            minRows={3}
            fullWidth
            disabled={confirmButtonLoading}
            helperText={`${reason.length}/${requireReason.maxLength} characters`}
            slotProps={{ htmlInput: { maxLength: requireReason.maxLength } }}
            sx={{ mt: 2.5 }}
          />
        )}
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
          disabled={confirmButtonDisabled || reasonMissing}
          onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
          startIcon={isDestructive ? <DeleteOutline /> : undefined}
          sx={{
            borderRadius: '24px',
            bgcolor: color,
            color: ink,
            '&:hover': { bgcolor: alpha(color, 0.88) },
          }}
        >
          {confirmButtonText}
        </Button>
      </Stack>
    </Dialog>
  );
}
