'use client';

import { useId, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import Close from '@mui/icons-material/Close';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';

export interface FileDropzoneProps {
  /** MIME types or extensions (".xlsx"), as for `<input accept>`. */
  accept: string[];
  /** Bytes. */
  maxSize: number;
  /** "Drag and drop your Excel file here, or Browse". */
  label: string;
  /** "Supported format: .xlsx". */
  helperText: string;
  /** Called with a file that passed the type and size checks. May be async (an upload). */
  onFile: (file: File) => void | Promise<void>;
  /** The chosen file, shown with ✕ to clear it (omit for upload-on-drop). */
  fileName?: string | null;
  onClear?: () => void;
  /** Shown under the zone, e.g. a server error. */
  error?: string | null;
  disabled?: boolean;
  /** Replaces the default content (the logo screen shows its thumbnail and Change Logo here). */
  children?: (browse: () => void, busy: boolean) => React.ReactNode;
  /** Error for a file of the wrong type, e.g. "Upload a JPEG or PNG image." */
  typeError?: string;
  /** Error for a file that's too big. */
  sizeError?: string;
}

const matches = (file: File, accept: string[]) =>
  accept.some((item) =>
    item.startsWith('.') ? file.name.toLowerCase().endsWith(item.toLowerCase()) : file.type === item,
  );

/**
 * Dashed drag-and-drop file picker with type and size checks (COMPONENTS.md → FileDropzone).
 * Generalised from the practice logo upload (which renders its own content through `children`):
 * bulk import, compliance and payroll documents, and policy uploads.
 */
export function FileDropzone({
  accept,
  maxSize,
  label,
  helperText,
  onFile,
  fileName,
  onClear,
  error,
  disabled = false,
  children,
  typeError = 'This file type is not supported.',
  sizeError = 'The file is too large.',
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError ?? error ?? null;

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return;
    setLocalError(null);
    if (!matches(file, accept)) return setLocalError(typeError);
    if (file.size > maxSize) return setLocalError(sizeError);
    setBusy(true);
    try {
      await onFile(file);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // By id rather than the ref, so `children` can be given `browse` while rendering.
  const browse = () => (document.getElementById(inputId) as HTMLInputElement | null)?.click();

  return (
    <Box>
      <Box
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
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
          border: `1.5px dashed ${shownError ? theme.palette.error.main : dragging ? theme.palette.primary.main : theme.tokens.border.bold}`,
          bgcolor: dragging ? theme.tokens.surface.tealLight : 'background.paper',
          opacity: disabled ? 0.6 : 1,
        })}
      >
        {children ? (
          children(browse, busy)
        ) : fileName ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
            <InsertDriveFileOutlined aria-hidden sx={{ color: 'primary.main' }} />
            <Typography sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, overflowWrap: 'anywhere' }}>
              {fileName}
            </Typography>
            {onClear && (
              <IconButton aria-label={`Remove ${fileName}`} size="small" onClick={onClear} disabled={disabled}>
                <Close fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ) : (
          <Stack spacing={0.5} sx={{ alignItems: 'center', textAlign: 'center', width: '100%' }}>
            {busy ? (
              <CircularProgress size={28} aria-label="Uploading" />
            ) : (
              <CloudUploadOutlined aria-hidden sx={{ fontSize: 32, color: 'primary.main' }} />
            )}
            <Typography component="label" htmlFor={inputId} sx={{ fontSize: 14, fontWeight: 500 }}>
              {label}{' '}
              <Button
                variant="text"
                size="small"
                onClick={browse}
                disabled={disabled || busy}
                sx={{ minWidth: 0, p: 0, verticalAlign: 'baseline', textDecoration: 'underline' }}
              >
                Browse
              </Button>
            </Typography>
            <Typography variant="caption">{helperText}</Typography>
          </Stack>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept.join(',')}
          hidden
          disabled={disabled}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </Box>
      {shownError && (
        <Typography role="alert" sx={{ fontSize: 12, color: 'error.main', mt: 0.75, ml: 1.75 }}>
          {shownError}
        </Typography>
      )}
    </Box>
  );
}
