'use client';

import { useSnackbar } from 'notistack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopy from '@mui/icons-material/ContentCopyOutlined';

/** ⧉ next to a patient name: copies it to the clipboard (live aria-label "Copy patient name"). */
export function CopyNameButton({ name, size = 'small' }: { name: string; size?: 'small' | 'medium' }) {
  const { enqueueSnackbar } = useSnackbar();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(name);
      enqueueSnackbar('Patient name copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to copy the patient name', { variant: 'error' });
    }
  };
  return (
    <Tooltip title="Copy patient name">
      <IconButton aria-label={`Copy patient name ${name}`} size={size} onClick={copy} sx={{ color: 'text.secondary' }}>
        <ContentCopy sx={{ fontSize: size === 'small' ? 16 : 20 }} />
      </IconButton>
    </Tooltip>
  );
}
