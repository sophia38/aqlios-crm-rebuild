'use client';

import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import UploadFile from '@mui/icons-material/UploadFileOutlined';
import { StatusChip } from '@/components/data/StatusChip';
import { DOCUMENT_STATUS_LABELS, isReverificationDue } from '@/lib/api/staff';
import type { StaffDocument } from '@/lib/api/types';

const date = (value: string | null) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

/**
 * One compliance document (COMPONENTS.md → ComplianceDocumentRow): name (* when required), the
 * uploaded file, dates, status, and Upload / Re-upload, plus Verify and Reject for managers.
 */
export function ComplianceDocumentRow({
  document,
  canVerify,
  uploadLocked,
  onUpload,
  onVerify,
  onReject,
}: {
  document: StaffDocument;
  /** Managers verify; nobody verifies their own documents. */
  canVerify: boolean;
  /** Your own verified documents are replaced by the practice (live: Re-upload disabled). */
  uploadLocked: boolean;
  onUpload: (document: StaffDocument) => void;
  onVerify: (document: StaffDocument) => void;
  onReject: (document: StaffDocument) => void;
}) {
  const due = isReverificationDue(document);
  const status = due ? 'Re-verification Due' : DOCUMENT_STATUS_LABELS[document.status];
  const facts = [
    { label: 'Uploaded Document', value: document.file_name ?? '-' },
    { label: 'Date Added', value: date(document.added_at) },
    { label: 'Issue Date', value: date(document.issue_date) },
    ...(document.has_expiry ? [{ label: 'Expiry Date', value: date(document.expiry_date) }] : []),
    ...(document.reverification ? [{ label: 'Re-verification Due', value: date(document.reverification_due) }] : []),
  ];

  return (
    <Box
      component="li"
      aria-label={document.name}
      sx={(theme) => ({
        listStyle: 'none',
        p: 1.5,
        borderRadius: `${theme.tokens.radius.input}px`,
        border: `1px solid ${theme.tokens.border.medium}`,
      })}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
            {document.name}
            {document.required && (
              <Box component="span" aria-hidden sx={(theme) => ({ color: theme.tokens.text.asterisk, ml: 0.25 })}>
                *
              </Box>
            )}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.25, mt: 0.5 }}>
            {facts.map((fact) => (
              <Typography key={fact.label} variant="caption">
                {fact.label}:{' '}
                <Box component="span" sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>
                  {fact.value}
                </Box>
              </Typography>
            ))}
          </Stack>
          {document.status === 'REJECTED' && document.rejection_reason && (
            <Typography variant="caption" sx={{ display: 'block', color: 'error.main', mt: 0.5 }}>
              Rejected: {document.rejection_reason}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <StatusChip status={status} tone={due ? 'warning' : undefined} />
          {canVerify && document.status === 'PENDING_VERIFICATION' && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<CheckCircleOutline />}
                onClick={() => onVerify(document)}
                aria-label={`Verify ${document.name}`}
              >
                Verify
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<CancelOutlined />}
                onClick={() => onReject(document)}
                aria-label={`Reject ${document.name}`}
              >
                Reject
              </Button>
            </>
          )}
          <Tooltip title={uploadLocked ? 'Verified documents are replaced by your practice' : ''}>
            <span>
              <Button
                size="small"
                variant="contained"
                startIcon={<UploadFile />}
                disabled={uploadLocked}
                onClick={() => onUpload(document)}
                aria-label={`${document.file_name ? 'Re-upload' : 'Upload'} ${document.name}`}
              >
                {document.file_name ? 'Re-upload' : 'Upload'}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
}
