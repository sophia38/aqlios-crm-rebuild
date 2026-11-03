'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Close from '@mui/icons-material/Close';
import FolderSharedOutlined from '@mui/icons-material/FolderSharedOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import QuestionAnswerOutlined from '@mui/icons-material/QuestionAnswerOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { patientsApi } from '@/lib/api/patients';
import type { HealthRecordFile, PatientConsultation } from '@/lib/api/types';
import { formatDate } from '@/lib/format';

type RequestsTab = 'records' | 'consultations';

/**
 * Medical Requests: Health Records (file rows with a viewer) and Consultations. Both are inferred:
 * the live calls failed or never returned during the capture (docs/practice/01-patients.md).
 */
export function MedicalRequestsCard({
  practiceId,
  patientId,
  records,
}: {
  practiceId: string;
  patientId: string;
  records: HealthRecordFile[];
}) {
  const [tab, setTab] = useState<RequestsTab>('records');
  const [viewing, setViewing] = useState<HealthRecordFile | null>(null);

  return (
    <FormSectionCard title="Medical Requests">
      <Stack spacing={2.5}>
        <Box>
          <SegmentedTabs<RequestsTab>
            aria-label="Medical requests"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'records', label: 'Health Records', icon: <FolderSharedOutlined /> },
              { value: 'consultations', label: 'Consultations', icon: <QuestionAnswerOutlined /> },
            ]}
          />
        </Box>
        <Box role="tabpanel" aria-label={tab === 'records' ? 'Health Records' : 'Consultations'}>
          {tab === 'records' ? (
            <HealthRecordList records={records} onView={setViewing} />
          ) : (
            <ConsultationList practiceId={practiceId} patientId={patientId} />
          )}
        </Box>
      </Stack>
      <FileViewer file={viewing} onClose={() => setViewing(null)} />
    </FormSectionCard>
  );
}

function HealthRecordList({
  records,
  onView,
}: {
  records: HealthRecordFile[];
  onView: (file: HealthRecordFile) => void;
}) {
  const theme = useTheme();
  if (records.length === 0) {
    return (
      <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
        No health records found.
      </Typography>
    );
  }
  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {records.map((file) => (
        <Stack
          key={file.id}
          component="li"
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
            px: 2,
            py: 1.25,
            borderRadius: `${theme.tokens.radius.input}px`,
            border: `1px solid ${theme.tokens.border.medium}`,
          }}
        >
          <PictureAsPdfOutlined aria-hidden sx={{ color: theme.tokens.tone.error.main }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap title={file.file_name} sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
              {file.file_name}
            </Typography>
            <Typography variant="caption">Date Added: {formatDate(file.date_added)}</Typography>
          </Box>
          <Tooltip title="View">
            <IconButton
              aria-label={`View ${file.file_name}`}
              onClick={() => onView(file)}
              sx={{ color: 'primary.main' }}
            >
              <VisibilityOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ))}
    </Stack>
  );
}

function ConsultationList({ practiceId, patientId }: { practiceId: string; patientId: string }) {
  const { enqueueSnackbar } = useSnackbar();
  const practiceHref = usePracticeHref();
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; items: PatientConsultation[] }
  >({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    patientsApi
      .consultations(PUBLIC_SUB_APP_ID, practiceId, patientId, controller.signal)
      .then((items) => setState({ status: 'ready', items }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: 'error' });
        enqueueSnackbar('Failed to load consultations', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, patientId, enqueueSnackbar]);

  if (state.status === 'loading') {
    return (
      <Box role="status" aria-label="Loading consultations" sx={{ display: 'grid', placeItems: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (state.status === 'error') {
    return (
      <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'error.main' }}>
        Could not load consultations.
      </Typography>
    );
  }
  if (state.items.length === 0) {
    return (
      <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
        No consultations found.
      </Typography>
    );
  }
  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {state.items.map((item) => (
        <Stack key={item.id} component="li" direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              component={Link}
              href={practiceHref(`/consultations-review/${item.id}`)}
              sx={{ fontSize: 14, fontWeight: 500, color: 'primary.main' }}
            >
              {item.request_name}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Submitted {formatDate(item.submitted_at)}
            </Typography>
          </Box>
          <StatusChip status={item.status} />
        </Stack>
      ))}
    </Stack>
  );
}

/** The file viewer: a placeholder preview, because the demo holds no real files. */
function FileViewer({ file, onClose }: { file: HealthRecordFile | null; onClose: () => void }) {
  const theme = useTheme();
  return (
    <Dialog
      open={file !== null}
      onClose={onClose}
      aria-labelledby="file-viewer-title"
      maxWidth={false}
      slotProps={{ paper: { sx: { width: 720, maxWidth: 'calc(100% - 32px)', m: 2, borderRadius: '16px' } } }}
    >
      {file && (
        <>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 3, pt: 2.5, pb: 1.5 }}>
            <PictureAsPdfOutlined aria-hidden sx={{ color: theme.tokens.tone.error.main }} />
            <Typography id="file-viewer-title" component="h2" noWrap sx={{ flex: 1, fontSize: 18, fontWeight: 700 }}>
              {file.file_name}
            </Typography>
            <IconButton aria-label="Close" onClick={onClose}>
              <Close />
            </IconButton>
          </Stack>
          <Box sx={{ px: 3, pb: 3 }}>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                textAlign: 'center',
                height: 320,
                mb: 2.5,
                borderRadius: `${theme.tokens.radius.input}px`,
                bgcolor: theme.tokens.neutral[100],
                color: theme.tokens.text.secondary,
              }}
            >
              <Box>
                <PictureAsPdfOutlined aria-hidden sx={{ fontSize: 48, mb: 1 }} />
                <Typography variant="body2">Preview isn&apos;t available in the demo.</Typography>
              </Box>
            </Box>
            <LabelValueList
              items={[
                { label: 'File type', value: file.file_type },
                { label: 'Size', value: `${file.size_kb.toLocaleString('en-GB')} KB` },
                { label: 'Date Added', value: formatDate(file.date_added) },
              ]}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Dialog>
  );
}
