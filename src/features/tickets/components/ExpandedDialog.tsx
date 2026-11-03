'use client';

import { useId } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';

/** The ⤢ view of a card (full conversation, notes history, full transcript): read-only, Esc closes. */
export function ExpandedDialog({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: (theme) => ({
            width: 900,
            maxWidth: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
            m: 2,
            borderRadius: `${theme.tokens.radius.base}px`,
            border: 'none',
          }),
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, px: 3, pt: 2.5 }}>
        <Box>
          <Typography id={titleId} component="h2" sx={{ fontSize: 20, fontWeight: 600 }}>
            {title}
          </Typography>
          {subtitle && <Typography variant="body2">{subtitle}</Typography>}
        </Box>
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Stack>
      <Box sx={{ px: 3, py: 2.5, overflowY: 'auto' }}>{children}</Box>
    </Dialog>
  );
}
