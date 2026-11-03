'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonRemoveOutlined from '@mui/icons-material/PersonRemoveOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { StatusChip } from '@/components/data/StatusChip';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { patientName, patientsApi, REGISTRATION_TYPE_LABELS } from '@/lib/api/patients';
import type { PatientDetail } from '@/lib/api/types';
import { CarerInformationCard } from './components/CarerInformationCard';
import { ContactPatientCard } from './components/ContactPatientCard';
import { ManageRegistrationCard } from './components/ManageRegistrationCard';
import { MedicalRequestsCard } from './components/MedicalRequestsCard';
import { PatientInformationCard } from './components/PatientInformationCard';
import { PatientNotesCard } from './components/PatientNotesCard';
import { PATIENTS_PATH } from './patientsRoutes';

type LoadState =
  { status: 'loading' } | { status: 'not-found' } | { status: 'error' } | { status: 'ready'; patient: PatientDetail };

const REASON_MAX = 300;

/** Patient Details (docs/practice/01-patients.md §2, plan §1b). */
export function PatientDetailsPage({ patientId }: { patientId: string }) {
  const router = useRouter();
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  usePracticeCrumbs([{ label: 'Patient Management', href: PATIENTS_PATH }, { label: 'Patient Details' }]);

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [loadedKey, setLoadedKey] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(false);
  const [deregistering, setDeregistering] = useState(false);
  const [busy, setBusy] = useState(false);

  const requestKey = `${practice.id}:${patientId}:${reloadKey}`;
  if (loadedKey !== requestKey && state.status !== 'loading') {
    setLoadedKey(requestKey);
    setState({ status: 'loading' });
  }

  useEffect(() => {
    const controller = new AbortController();
    const key = `${practice.id}:${patientId}:${reloadKey}`;
    const settle = (next: LoadState) => {
      setLoadedKey(key);
      setState(next);
    };
    patientsApi
      .get(PUBLIC_SUB_APP_ID, practice.id, patientId, controller.signal)
      .then((patient) => settle({ status: 'ready', patient }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.code === 404) {
          settle({ status: 'not-found' });
          return;
        }
        settle({ status: 'error' });
        enqueueSnackbar('Failed to load patient', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practice.id, patientId, reloadKey, enqueueSnackbar]);

  const listHref = practiceHref(PATIENTS_PATH);

  if (state.status === 'loading') return <LoadingSpinner message="Loading patient..." />;
  if (state.status === 'not-found') {
    return (
      <AccessDenied
        title="Patient not found"
        message="The patient may have been removed, or the link is wrong."
        backHref={listHref}
        backLabel="Go to Patient Management"
      />
    );
  }
  if (state.status === 'error') {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', py: 8, textAlign: 'center' }} role="alert">
        <Box sx={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</Box>
        <Box sx={{ color: 'text.secondary' }}>Could not load this patient.</Box>
        <Button variant="contained" onClick={() => setReloadKey((key) => key + 1)}>
          Try again
        </Button>
      </Stack>
    );
  }

  const { patient } = state;
  const name = patientName(patient);
  const readOnly = patient.archived;
  const notRegistered = patient.registration_status === 'PATIENT_NOT_REGISTERED';
  const update = (next: PatientDetail) => setState({ status: 'ready', patient: next });

  const deregister = async (reason?: string) => {
    setBusy(true);
    try {
      const saved = await patientsApi.deregister(PUBLIC_SUB_APP_ID, practice.id, patient.id, reason ?? '');
      update(saved);
      setDeregistering(false);
      enqueueSnackbar('Patient deregistered', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to deregister the patient', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <GoBackLink variant="pill" onClick={() => router.push(listHref)}>
          Back
        </GoBackLink>
      </Box>
      <ModulePageHeader
        title="Patient Details"
        subtitle={name}
        titleAdornment={
          <Stack direction="row" spacing={1}>
            <StatusChip status={REGISTRATION_TYPE_LABELS[patient.registration_type]} tone="neutral" />
            {patient.carer?.verified && <StatusChip status="Carer Verified" tone="secondary" />}
            {patient.archived && <StatusChip status="Archived" />}
          </Stack>
        }
        actions={
          <>
            {/* No clinical system in the demo; disabled as in live. */}
            <Tooltip title="No clinical system is connected">
              <span>
                <Button variant="outlined" startIcon={<VisibilityOutlined />} disabled>
                  Open in Clinical Systems
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              color="error"
              startIcon={<PersonRemoveOutlined />}
              onClick={() => setDeregistering(true)}
              disabled={readOnly || notRegistered}
            >
              Deregister Patient
            </Button>
            <Button
              variant="contained"
              color="brand"
              startIcon={<EditOutlined />}
              onClick={() => setEditing(true)}
              disabled={readOnly || editing}
            >
              Edit Details
            </Button>
          </>
        }
      />
      <Stack spacing={2.5}>
        {patient.archived && (
          <Alert severity="info">This patient is archived. Their record can be viewed but not changed.</Alert>
        )}
        {notRegistered && patient.deregistration_reason && (
          <Alert severity="warning">Not registered at this practice. Reason: {patient.deregistration_reason}</Alert>
        )}
        <ManageRegistrationCard practiceId={practice.id} patient={patient} readOnly={readOnly} onSaved={update} />
        <PatientNotesCard
          practiceId={practice.id}
          patientId={patient.id}
          notes={patient.notes}
          readOnly={readOnly}
          onChange={(notes) => update({ ...patient, notes })}
        />
        <PatientInformationCard
          practiceId={practice.id}
          patient={patient}
          editing={editing}
          onEditingChange={setEditing}
          onSaved={update}
        />
        <CarerInformationCard carer={patient.carer} />
        <ContactPatientCard practiceId={practice.id} patient={patient} readOnly={readOnly} />
        <MedicalRequestsCard practiceId={practice.id} patientId={patient.id} records={patient.health_records} />
      </Stack>
      <ConfirmDialog
        open={deregistering}
        title="Deregister Patient"
        message={`Deregister ${name}? They will no longer be registered at this practice.`}
        confirmButtonText="Deregister Patient"
        confirmButtonLoading={busy}
        requireReason={{ label: 'Reason', maxLength: REASON_MAX, required: true }}
        onClose={() => setDeregistering(false)}
        onConfirm={deregister}
      />
    </>
  );
}
