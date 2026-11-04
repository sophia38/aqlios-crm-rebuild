'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import UploadFile from '@mui/icons-material/UploadFileOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { FileDropzone } from '@/components/forms/FileDropzone';
import { FormModal } from '@/components/modals/FormModal';
import { DOCUMENT_MAX_BYTES } from '@/lib/api/staff';

/** Captured: "Supported formats: PDF, JPG, PNG, DOC, DOCX | Maximum file size: 10MB". */
export const DOCUMENT_ACCEPT = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.doc',
  '.docx',
];

/**
 * Upload or replace one document: the file, plus Issue Date and (for certificates that expire) a
 * required Expiry Date. Nothing leaves the browser in the demo; only the file name is kept.
 */
export function UploadDocumentDialog({
  open,
  title,
  withDates,
  requireExpiry,
  onClose,
  onUpload,
}: {
  open: boolean;
  title: string;
  /** Compliance documents ask for dates; payroll documents don't. */
  withDates: boolean;
  requireExpiry: boolean;
  onClose: () => void;
  onUpload: (input: { file_name: string; issue_date?: string; expiry_date?: string }) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [issue, setIssue] = useState<dayjs.Dayjs | null>(null);
  const [expiry, setExpiry] = useState<dayjs.Dayjs | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setIssue(null);
    setExpiry(null);
  };
  const expiryError = expiry && !expiry.isAfter(dayjs(), 'day') ? 'Expiry Date must be in the future' : undefined;
  const issueError = issue && issue.isAfter(dayjs(), 'day') ? "Issue Date can't be in the future" : undefined;
  const valid =
    Boolean(file) &&
    !issueError &&
    !expiryError &&
    (!requireExpiry || Boolean(expiry?.isValid())) &&
    (!issue || issue.isValid());

  return (
    <FormModal
      open={open}
      title={title}
      subtitle="Supported formats: PDF, JPG, PNG, DOC, DOCX | Maximum file size: 10MB"
      onClose={() => {
        reset();
        onClose();
      }}
      onSubmit={async () => {
        if (!file) return;
        setBusy(true);
        try {
          await onUpload({
            file_name: file.name,
            issue_date: issue?.format('YYYY-MM-DD'),
            expiry_date: expiry?.format('YYYY-MM-DD'),
          });
          reset();
        } finally {
          setBusy(false);
        }
      }}
      submitLabel="Upload Document"
      submitIcon={<UploadFile />}
      submitDisabled={!valid}
      submitting={busy}
    >
      <Stack spacing={2}>
        <FileDropzone
          accept={DOCUMENT_ACCEPT}
          maxSize={DOCUMENT_MAX_BYTES}
          label="Drag and drop your document here, or"
          helperText="PDF, JPG, PNG, DOC or DOCX up to 10MB"
          typeError="Upload a PDF, JPG, PNG, DOC or DOCX file."
          sizeError="The file must be 10MB or smaller."
          fileName={file?.name}
          onClear={() => setFile(null)}
          onFile={setFile}
        />
        {withDates && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Issue Date"
                value={issue}
                format="DD/MM/YYYY"
                maxDate={dayjs()}
                onChange={setIssue}
                slotProps={{ textField: { fullWidth: true, error: Boolean(issueError), helperText: issueError } }}
              />
            </Grid>
            {requireExpiry && (
              <Grid size={{ xs: 12, md: 6 }}>
                <DatePicker
                  label="Expiry Date"
                  value={expiry}
                  format="DD/MM/YYYY"
                  minDate={dayjs().add(1, 'day')}
                  onChange={setExpiry}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: Boolean(expiryError),
                      helperText: expiryError,
                    },
                  }}
                />
              </Grid>
            )}
          </Grid>
        )}
      </Stack>
    </FormModal>
  );
}
