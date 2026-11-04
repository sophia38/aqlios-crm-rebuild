'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircle from '@mui/icons-material/CheckCircle';
import CloudDoneOutlined from '@mui/icons-material/CloudDoneOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import { EntityAvatar } from '@/components/primitives/EntityAvatar';
import { FileDropzone } from './FileDropzone';

const ACCEPTED = ['image/jpeg', 'image/png'];
const MAX_BYTES = 10 * 1024 * 1024;

export interface LogoUploadDropzoneProps {
  /** Current logo URL ('' when none). */
  value: string;
  /** Uploads the file and resolves with the stored URL. */
  onUpload: (file: File) => Promise<string>;
  onChange: (url: string) => void;
  practiceName: string;
}

/**
 * Dashed drag-and-drop logo upload (COMPONENTS.md → LogoUploadDropzone): the logo look of
 * `FileDropzone`. Empty: drop zone with Browse File. With a logo: framed thumbnail, ✓ Saved, Change
 * Logo and 🗑 (practice profile).
 */
export function LogoUploadDropzone({ value, onUpload, onChange, practiceName }: LogoUploadDropzoneProps) {
  const [error, setError] = useState<string | null>(null);
  const pill = (theme: { tokens: { radius: { pill: number } } }) => ({ borderRadius: `${theme.tokens.radius.pill}px` });

  return (
    <FileDropzone
      accept={ACCEPTED}
      maxSize={MAX_BYTES}
      label="Choose a file or drag & drop your practice logo here"
      helperText="JPEG or PNG up to 10MB"
      typeError="Upload a JPEG or PNG image."
      sizeError="The logo must be 10MB or smaller."
      error={error}
      onFile={async (file) => {
        setError(null);
        try {
          onChange(await onUpload(file));
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : 'Logo upload failed. Please try again.');
        }
      }}
    >
      {(browse, uploading) =>
        value ? (
          <>
            <EntityAvatar name={practiceName || 'Practice'} logoSrc={value} size={80} borderRadius={12} framed />
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1, color: 'success.main' }}>
              <CheckCircle fontSize="small" />
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'inherit' }}>Saved</Typography>
            </Stack>
            <Button variant="outlined" onClick={browse} disabled={uploading} sx={pill}>
              Change Logo
            </Button>
            <IconButton aria-label="Remove logo" onClick={() => onChange('')} sx={{ color: 'error.main' }}>
              <DeleteOutline />
            </IconButton>
          </>
        ) : (
          <>
            <CloudDoneOutlined aria-hidden sx={{ fontSize: 36, color: 'primary.main' }} />
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ display: 'block', fontSize: 15, fontWeight: 600 }}>
                Choose a file or drag & drop your practice logo here
              </Typography>
              <Typography variant="body2">JPEG or PNG up to 10MB</Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={browse}
              disabled={uploading}
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : undefined}
              sx={(theme) => ({
                ...pill(theme),
                color: 'text.primary',
                borderColor: theme.tokens.neutral[900],
              })}
            >
              Browse File
            </Button>
          </>
        )
      }
    </FileDropzone>
  );
}
