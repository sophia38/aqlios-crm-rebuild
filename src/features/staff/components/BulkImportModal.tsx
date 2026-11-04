'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Check from '@mui/icons-material/Check';
import Download from '@mui/icons-material/DownloadOutlined';
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined';
import { FileDropzone } from '@/components/forms/FileDropzone';
import { FormModal } from '@/components/modals/FormModal';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { staffApi } from '@/lib/api/staff';
import type { StaffImportInfo, StaffImportResult } from '@/lib/api/types';
import {
  buildTemplate,
  IMPORT_ACCEPT,
  IMPORT_FORMAT_LABEL,
  IMPORT_MAX_BYTES,
  IMPORT_TEMPLATE_NAME,
  readRows,
  saveFile,
} from '../staffImportFile';

const fixing = (count: number) => (count === 1 ? '1 row needs fixing:' : `${count} rows need fixing:`);

/**
 * Bulk Import Staff (docs/practice/05-staff-onboarding.md §5): Step 1 Download Template, Step 2
 * upload, then Import Staff. Valid rows become Pending Invite staff; invalid rows are listed with
 * their row number and problem, and the dialog stays open so they can be fixed.
 */
export function BulkImportModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [info, setInfo] = useState<StaffImportInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [result, setResult] = useState<StaffImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    staffApi
      .importInfo(PUBLIC_SUB_APP_ID, practice.id, controller.signal)
      .then(setInfo)
      .catch(() => {
        if (!controller.signal.aborted) enqueueSnackbar('Failed to load the import template', { variant: 'error' });
      });
    return () => controller.abort();
  }, [open, practice.id, enqueueSnackbar]);

  const close = () => {
    setFile(null);
    setFileError(null);
    setResult(null);
    onClose();
  };

  const runImport = async () => {
    if (!file) return;
    setImporting(true);
    setFileError(null);
    try {
      const rows = await readRows(file);
      const outcome = await staffApi.bulkImport(PUBLIC_SUB_APP_ID, practice.id, rows);
      if (outcome.created) {
        enqueueSnackbar(`${outcome.created} staff imported`, { variant: 'success' });
      }
      if (outcome.errors.length) {
        // Keep the dialog open with the problems listed; the imported rows are already in.
        setResult(outcome);
        setFile(null);
        if (outcome.created) onImported();
      } else {
        close();
        onImported();
      }
    } catch (error) {
      setFileError(
        error instanceof ApiError
          ? error.code === 400
            ? error.message
            : 'Failed to import staff. Please try again.'
          : error instanceof Error
            ? error.message
            : 'The file could not be read.',
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <FormModal
      open={open}
      title="Bulk Import Staff"
      subtitle="Import existing staff accounts in one go. After the import is complete, each staff member will receive an invitation to activate their account."
      onClose={close}
      onSubmit={() => void runImport()}
      submitLabel="Import Staff"
      submitIcon={<Check />}
      submitDisabled={!file}
      submitting={importing}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
            Step 1: Get the template
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={(theme) => ({
              alignItems: { xs: 'flex-start', sm: 'center' },
              p: 1.5,
              borderRadius: `${theme.tokens.radius.input}px`,
              border: `1px solid ${theme.tokens.border.medium}`,
            })}
          >
            <InsertDriveFileOutlined aria-hidden sx={{ color: 'primary.main' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 600, overflowWrap: 'anywhere' }}>
                {IMPORT_TEMPLATE_NAME}
              </Typography>
              <Typography variant="caption">Includes the columns, sample rows and the valid role names.</Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              disabled={!info}
              onClick={() => info && saveFile(buildTemplate(info.roles, info.staff_types), IMPORT_TEMPLATE_NAME)}
            >
              Download Template
            </Button>
          </Stack>
          {info && (
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Valid roles: {info.roles.join(', ')}. Valid staff types: {info.staff_types.join(', ')}.
            </Typography>
          )}
        </Box>
        <Box>
          <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
            Step 2: Upload your completed file{' '}
            <Box component="span" sx={(theme) => ({ color: theme.tokens.text.asterisk })}>
              *
            </Box>
          </Typography>
          <FileDropzone
            accept={IMPORT_ACCEPT}
            maxSize={IMPORT_MAX_BYTES}
            label="Drag and drop your file here, or"
            helperText={`Supported format: ${IMPORT_FORMAT_LABEL}`}
            typeError={`Upload a ${IMPORT_FORMAT_LABEL} file.`}
            sizeError="The file must be 2MB or smaller."
            fileName={file?.name}
            onClear={() => setFile(null)}
            error={fileError}
            disabled={importing}
            onFile={(chosen) => {
              setFile(chosen);
              setFileError(null);
              setResult(null);
            }}
          />
        </Box>
        {result && result.errors.length > 0 && (
          <Alert severity="warning" role="alert">
            {result.created
              ? `${result.created} staff imported. ${fixing(result.errors.length)}`
              : `No staff imported. ${fixing(result.errors.length)}`}
            <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
              {result.errors.map((item) => (
                <li key={`${item.row}-${item.message}`}>
                  Row {item.row}: {item.message}
                </li>
              ))}
            </Box>
          </Alert>
        )}
        <Alert severity="info">
          This import creates basic staff accounts only. Compliance documents (DBS, Right to Work, training) are added
          later by staff or HR.
        </Alert>
      </Stack>
    </FormModal>
  );
}
