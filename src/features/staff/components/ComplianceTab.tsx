'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import { StatsStrip } from '@/components/data/StatsStrip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { STAFF_REASON_MAX, staffApi } from '@/lib/api/staff';
import type { StaffDocument } from '@/lib/api/types';
import type { StaffTabProps } from '../staffForm';
import { ComplianceDocumentRow } from './ComplianceDocumentRow';
import { UploadDocumentDialog } from './UploadDocumentDialog';

/**
 * Compliance (docs/practice/05-staff-onboarding.md §6): counters, then the 9 document groups. Each
 * document is saved on its own (not with Save Changes). The CQC dashboard reads the same documents.
 */
export function ComplianceTab({ staff, self, onSaved }: Omit<StaffTabProps, 'bind'>) {
  const theme = useTheme();
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [uploading, setUploading] = useState<StaffDocument | null>(null);
  const [verifying, setVerifying] = useState<StaffDocument | null>(null);
  const [rejecting, setRejecting] = useState<StaffDocument | null>(null);
  const [busy, setBusy] = useState(false);

  const replace = (document: StaffDocument) =>
    onSaved({ ...staff, documents: staff.documents.map((item) => (item.key === document.key ? document : item)) });

  const count = (status: StaffDocument['status']) => staff.documents.filter((item) => item.status === status).length;
  const { tone } = theme.tokens;
  const groups = [...new Set(staff.documents.map((item) => item.group))];

  const check = async (document: StaffDocument, action: 'verify' | 'reject', reason?: string) => {
    setBusy(true);
    try {
      const saved =
        action === 'verify'
          ? await staffApi.verifyDocument(PUBLIC_SUB_APP_ID, practice.id, staff.id, document.key)
          : await staffApi.rejectDocument(PUBLIC_SUB_APP_ID, practice.id, staff.id, document.key, reason ?? '');
      replace(saved);
      enqueueSnackbar(action === 'verify' ? 'Document verified' : 'Document rejected', { variant: 'success' });
      setVerifying(null);
      setRejecting(null);
    } catch {
      enqueueSnackbar(action === 'verify' ? 'Failed to verify the document' : 'Failed to reject the document', {
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <FormSectionCard title="Compliance Verification">
        <StatsStrip
          variant="pill"
          items={[
            {
              label: 'Pending Verification',
              value: count('PENDING_VERIFICATION'),
              color: tone.info.main,
              tint: tone.info.strongBg,
            },
            { label: 'Verified', value: count('VERIFIED'), color: tone.success.main, tint: tone.success.strongBg },
            { label: 'Rejected', value: count('REJECTED'), color: tone.error.main, tint: tone.error.strongBg },
            {
              label: 'Pending Upload',
              value: count('PENDING_UPLOAD'),
              color: tone.warning.main,
              tint: tone.warning.strongBg,
            },
            { label: 'Expired', value: count('EXPIRED'), color: tone.secondary.main, tint: tone.secondary.strongBg },
          ]}
        />
      </FormSectionCard>
      {groups.map((group) => (
        <FormSectionCard key={group} title={group}>
          <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0 }}>
            {staff.documents
              .filter((item) => item.group === group)
              .map((document) => (
                <ComplianceDocumentRow
                  key={document.key}
                  document={document}
                  canVerify={!self}
                  uploadLocked={self && document.status === 'VERIFIED'}
                  onUpload={setUploading}
                  onVerify={setVerifying}
                  onReject={setRejecting}
                />
              ))}
          </Stack>
        </FormSectionCard>
      ))}
      <UploadDocumentDialog
        open={uploading !== null}
        title={uploading ? `${uploading.file_name ? 'Re-upload' : 'Upload'} ${uploading.name}` : 'Upload Document'}
        withDates
        requireExpiry={Boolean(uploading?.has_expiry)}
        onClose={() => setUploading(null)}
        onUpload={async (input) => {
          if (!uploading) return;
          try {
            replace(await staffApi.uploadDocument(PUBLIC_SUB_APP_ID, practice.id, staff.id, uploading.key, input));
            enqueueSnackbar('Document uploaded', { variant: 'success' });
            setUploading(null);
          } catch {
            enqueueSnackbar('Failed to upload the document', { variant: 'error' });
          }
        }}
      />
      <ConfirmDialog
        open={verifying !== null}
        title="Verify Document"
        message={verifying && `Mark ${verifying.name} (${verifying.file_name}) as verified?`}
        confirmButtonText="Verify Document"
        confirmButtonVariant="success"
        confirmButtonLoading={busy}
        onClose={() => setVerifying(null)}
        onConfirm={() => verifying && void check(verifying, 'verify')}
      />
      {rejecting && (
        <ConfirmDialog
          open
          title="Reject Document"
          message={`Reject ${rejecting.name}? ${staff.first_name || 'The staff member'} will be asked to upload it again.`}
          confirmButtonText="Reject Document"
          confirmButtonVariant="error"
          confirmButtonLoading={busy}
          requireReason={{ label: 'Reason', maxLength: STAFF_REASON_MAX, required: true }}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) => void check(rejecting, 'reject', reason)}
        />
      )}
    </Stack>
  );
}
