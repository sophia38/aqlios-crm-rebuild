'use client';

import { useId, useRef, useState } from 'react';
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
 * Dashed drag-and-drop logo upload (COMPONENTS.md → LogoUploadDropzone). Empty: drop zone with
 * Browse File. With a logo: framed thumbnail, ✓ Saved, Change Logo and 🗑 (practice profile).
 */
export function LogoUploadDropzone({ value, onUpload, onChange, practiceName }: LogoUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED.includes(file.type)) return setError('Upload a JPEG or PNG image.');
    if (file.size > MAX_BYTES) return setError('The logo must be 10MB or smaller.');
    setUploading(true);
    try {
      onChange(await onUpload(file));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Logo upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const browse = () => inputRef.current?.click();

  return (
    <Box>
      <Box
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          p: { xs: 2, md: 3 },
          borderRadius: `${theme.tokens.radius.card}px`,
          border: `1.5px dashed ${error ? theme.palette.error.main : dragging ? theme.palette.primary.main : theme.tokens.border.bold}`,
          bgcolor: dragging ? theme.tokens.surface.tealLight : 'background.paper',
        })}
      >
        {value ? (
          <>
            <EntityAvatar name={practiceName || 'Practice'} logoSrc={value} size={80} borderRadius={12} framed />
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flex: 1, color: 'success.main' }}>
              <CheckCircle fontSize="small" />
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'inherit' }}>Saved</Typography>
            </Stack>
            <Button
              variant="outlined"
              onClick={browse}
              disabled={uploading}
              sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
            >
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
              <Typography component="label" htmlFor={inputId} sx={{ display: 'block', fontSize: 15, fontWeight: 600 }}>
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
                borderRadius: `${theme.tokens.radius.pill}px`,
                color: 'text.primary',
                borderColor: theme.tokens.neutral[900],
              })}
            >
              Browse File
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED.join(',')}
          hidden
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </Box>
      {error && (
        <Typography role="alert" sx={{ fontSize: 12, color: 'error.main', mt: 0.75, ml: 1.75 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
