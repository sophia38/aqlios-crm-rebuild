'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { useCurrentPractice, usePracticeCrumbs, usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { formatNhsNumber, patientName, patientsApi, REGISTRATION_TYPE_LABELS } from '@/lib/api/patients';
import { REGISTRATION_TYPES, type Patient } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { CarerInfoTooltip } from './components/CarerInfoTooltip';
import { RegistrationStatusIcon } from './components/RegistrationStatusIcon';
import { patientPath } from './patientsRoutes';

/** Patient Management list (docs/practice/01-patients.md §1). Follows the Practice Management list. */
export function PatientListPage() {
  const theme = useTheme();
  const practice = useCurrentPractice();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  usePracticeCrumbs([{ label: 'Patient Management' }]);

  const fetcher = useCallback<PagedFetcher<Patient>>(
    (params, signal) => patientsApi.list(PUBLIC_SUB_APP_ID, practice.id, params, signal),
    [practice.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    errorText: 'Could not load patients.',
    errorToast: 'Failed to load patients',
  });
  const [archiving, setArchiving] = useState<Patient | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = Boolean(list.query.search || Object.values(list.query.filters).some(Boolean));
  const registrationDate = list.query.filters.registration_date ?? '';

  const archive = async () => {
    if (!archiving) return;
    setBusy(true);
    try {
      await patientsApi.archive(PUBLIC_SUB_APP_ID, practice.id, archiving.id);
      enqueueSnackbar('Patient archived.', { variant: 'success' });
      setArchiving(null);
      list.reload();
    } catch {
      enqueueSnackbar('Failed to archive the patient', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const columns: DataTableColumn<Patient>[] = [
    {
      id: 'number',
      label: '#',
      width: 48,
      render: (patient) => list.query.page * list.query.pageSize + list.rows.indexOf(patient) + 1,
    },
    {
      id: 'name',
      label: 'Patient Name',
      render: (patient) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}>{patientName(patient)}</Typography>
          <Typography variant="caption">NHS: {formatNhsNumber(patient.nhs_number)}</Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      render: (patient) => <RegistrationStatusIcon status={patient.registration_status} />,
    },
    {
      id: 'phone',
      label: 'Phone Number',
      render: (patient) => <Box sx={{ whiteSpace: 'nowrap' }}>{patient.phone_number || '-'}</Box>,
    },
    { id: 'email', label: 'Email', render: (patient) => patient.email || '-' },
    {
      id: 'type',
      label: 'Registration Type',
      render: (patient) => (
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            px: 1,
            py: 0.25,
            borderRadius: `${theme.tokens.radius.pill}px`,
            bgcolor: theme.tokens.neutral[100],
            fontSize: 12,
            whiteSpace: 'nowrap',
          }}
        >
          {REGISTRATION_TYPE_LABELS[patient.registration_type]}
        </Box>
      ),
    },
    {
      id: 'carer',
      label: 'Carer',
      render: (patient) => (patient.carer ? <CarerInfoTooltip carer={patient.carer} /> : '-'),
    },
    { id: 'postcode', label: 'Postcode', render: (patient) => patient.address.post_code || '-' },
    {
      id: 'dob',
      label: 'Date of Birth',
      render: (patient) => formatDate(patient.date_of_birth),
    },
    { id: 'sex', label: 'Sex at Birth', render: (patient) => patient.sex_at_birth || '-' },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (patient) => {
        const name = patientName(patient);
        return (
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
            <Tooltip title="View">
              <IconButton
                component={Link}
                href={practiceHref(patientPath(patient.id))}
                aria-label={`View ${name}`}
                size="small"
                sx={{ color: 'primary.main' }}
              >
                <VisibilityOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Archive">
              <IconButton
                aria-label={`Archive ${name}`}
                size="small"
                onClick={() => setArchiving(patient)}
                sx={{ color: 'text.secondary' }}
              >
                <ArchiveOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
    },
  ];

  return (
    <>
      <ModulePageHeader title="Patient Management" subtitle="Manage patient registrations." />
      <Stack spacing={2.5}>
        <FilterBar
          filters={[
            {
              id: 'registration_type',
              label: 'Registration Type',
              allLabel: 'All',
              options: REGISTRATION_TYPES.map((type) => ({ value: type, label: REGISTRATION_TYPE_LABELS[type] })),
            },
          ]}
          values={{
            registration_type: list.query.filters.registration_type ?? '',
            registration_date: registrationDate,
          }}
          onChange={list.setFilter}
          search={{
            value: list.query.search,
            onChange: list.setSearch,
            label: 'Search',
            placeholder: 'Search by Name, NHS #, Phone No or email ID',
          }}
          onClear={list.clear}
        >
          <DatePicker
            label="Registration Date"
            value={registrationDate ? dayjs(registrationDate) : null}
            format="DD/MM/YYYY"
            onChange={(next) => {
              if (next === null) list.setFilter('registration_date', '');
              else if (next.isValid()) list.setFilter('registration_date', next.format('YYYY-MM-DD'));
            }}
            slotProps={{
              textField: {
                size: 'small',
                slotProps: { inputLabel: { shrink: true } },
                sx: { width: 190, '& .MuiPickersInputBase-root': { fontSize: 13 } },
              },
              field: { clearable: true },
            }}
          />
        </FilterBar>
        <DataTable
          aria-label="Patients"
          columns={columns}
          rows={list.rows}
          getRowId={(patient) => patient.id}
          page={list.query.page}
          rowsPerPage={list.query.pageSize}
          totalCount={list.count}
          onPageChange={list.setPage}
          onRowsPerPageChange={list.setPageSize}
          loading={list.loading}
          error={list.error}
          emptyMessage={filtered ? 'No patients found. Try another search.' : 'No registered patients yet.'}
          minWidth={1180}
        />
      </Stack>
      <ConfirmDialog
        open={archiving !== null}
        title="Archive Patient"
        message={archiving && `Archive ${patientName(archiving)}? They will be moved out of the active patient list.`}
        warning="Archived patients can no longer be managed from this list."
        confirmButtonText="Archive Patient"
        confirmButtonVariant="warning"
        confirmButtonLoading={busy}
        onClose={() => setArchiving(null)}
        onConfirm={archive}
      />
    </>
  );
}
