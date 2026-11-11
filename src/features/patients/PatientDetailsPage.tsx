'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
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
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { formatNhsNumber, patientName, patientsApi, REGISTRATION_TYPE_LABELS } from '@/lib/api/patients';
import type { PatientDetail } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { CarerInformationCard } from './components/CarerInformationCard';
import { ContactPatientCard } from './components/ContactPatientCard';
import { ManageRegistrationCard } from './components/ManageRegistrationCard';
import { MedicalRequestsPanel, usePatientConsultations } from './components/MedicalRequestsPanel';
import { PatientInformationCard } from './components/PatientInformationCard';
import { PatientNotesCard } from './components/PatientNotesCard';
import { PatientOverview, type ProfileTab } from './components/PatientOverview';
import { PATIENTS_PATH } from './patientsRoutes';

type LoadState =
  { status: 'loading' } | { status: 'not-found' } | { status: 'error' } | { status: 'ready'; patient: PatientDetail };

const REASON_MAX = 300;

const TABS: ProfileTab[] = ['overview', 'details', 'carer', 'contact', 'requests', 'notes'];

/** `#notes` in the URL opens that tab. */
function tabFromHash(): ProfileTab {
  if (typeof window === 'undefined') return 'overview';
  const hash = window.location.hash.slice(1) as ProfileTab;
  return TABS.includes(hash) ? hash : 'overview';
}

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

  return (
    <PatientProfile
      patient={state.patient}
      onBack={() => router.push(listHref)}
      onChange={(patient) => setState({ status: 'ready', patient })}
    />
  );
}

/** The loaded profile: header, Manage Registration, then the section tabs (tabbed variation of §2). */
function PatientProfile({
  patient,
  onBack,
  onChange,
}: {
  patient: PatientDetail;
  onBack: () => void;
  onChange: (patient: PatientDetail) => void;
}) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState<ProfileTab>(tabFromHash);
  const [addingNote, setAddingNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deregistering, setDeregistering] = useState(false);
  const [busy, setBusy] = useState(false);
  const consultations = usePatientConsultations(practice.id, patient.id);

  const name = patientName(patient);
  const readOnly = patient.archived;
  const notRegistered = patient.registration_status === 'PATIENT_NOT_REGISTERED';
  const update = onChange;

  const open = (next: ProfileTab) => {
    setTab(next);
    if (next !== 'notes') setAddingNote(false);
    window.history.replaceState(null, '', next === 'overview' ? window.location.pathname : `#${next}`);
  };
  const age = dayjs().diff(dayjs(patient.date_of_birth), 'year');
  const requestCount =
    patient.medications.length +
    patient.health_records.length +
    (consultations.status === 'ready' ? consultations.items.length : 0);

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
        <GoBackLink variant="pill" onClick={onBack}>
          Back
        </GoBackLink>
      </Box>
      <ModulePageHeader
        icon={<Initials name={name} />}
        title={name}
        subtitle={`NHS ${formatNhsNumber(patient.nhs_number)} · ${formatDate(patient.date_of_birth)} (${age} ${age === 1 ? 'year' : 'years'})`}
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
              onClick={() => {
                open('details');
                setEditing(true);
              }}
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
        <ManageRegistrationCard
          practiceId={practice.id}
          patient={patient}
          readOnly={readOnly}
          onSaved={update}
          collapsible={false}
        />
        <Box>
          <SegmentedTabs<ProfileTab>
            aria-label="Patient profile sections"
            idPrefix="patient-profile"
            value={tab}
            onChange={open}
            items={[
              { value: 'overview', label: 'Overview' },
              { value: 'details', label: 'Personal Details' },
              { value: 'carer', label: 'Carer' },
              { value: 'contact', label: 'Contact Patient' },
              { value: 'requests', label: 'Medical Requests', count: requestCount },
              { value: 'notes', label: 'Notes', count: patient.notes.length },
            ]}
          />
        </Box>
        {/* Only the open tab is mounted. */}
        <Box role="tabpanel" id={`patient-profile-panel-${tab}`} aria-labelledby={`patient-profile-tab-${tab}`}>
          {tab === 'overview' && (
            <PatientOverview
              patient={patient}
              consultations={consultations}
              readOnly={readOnly}
              onOpen={open}
              onAddNote={() => {
                open('notes');
                setAddingNote(true);
              }}
            />
          )}
          {tab === 'details' && (
            <PatientInformationCard
              practiceId={practice.id}
              patient={patient}
              editing={editing}
              onEditingChange={setEditing}
              onSaved={update}
              variant="text"
            />
          )}
          {tab === 'carer' && <CarerInformationCard carer={patient.carer} variant="text" />}
          {tab === 'contact' && (
            <ContactPatientCard practiceId={practice.id} patient={patient} readOnly={readOnly} collapsible={false} />
          )}
          {tab === 'requests' && (
            <MedicalRequestsPanel
              consultations={consultations}
              medications={patient.medications}
              records={patient.health_records}
            />
          )}
          {tab === 'notes' && (
            <PatientNotesCard
              practiceId={practice.id}
              patientId={patient.id}
              notes={patient.notes}
              readOnly={readOnly}
              onChange={(notes) => update({ ...patient, notes })}
              collapsible={false}
              startAdding={addingNote}
            />
          )}
        </Box>
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

/** The patient's initials in a teal circle, filling the header's icon tile. */
function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <Box
      sx={(theme) => ({
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        borderRadius: '50%',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontSize: theme.typography.pxToRem(17),
        fontWeight: 600,
      })}
    >
      {initials}
    </Box>
  );
}
