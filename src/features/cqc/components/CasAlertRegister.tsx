'use client';

import { useCallback, useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AddCircleOutlineOutlined from '@mui/icons-material/AddCircleOutlineOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import {
  CQC_ALERT_ACTION_LABELS,
  CQC_APPLICABLE_LABELS,
  CQC_SIGN_OFF_LABELS,
  cqcApi,
  type CqcAlert,
} from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { formatDate } from '@/lib/format';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { useCqcPractice } from '../CqcShell';
import { DueDate } from '../format';
import { AlertDrawer } from './AlertDrawer';

/** The alert register under the CAS Alerts checklist: one row per alert, from receipt to sign-off. */
export function CasAlertRegister() {
  const practice = useCqcPractice();
  // `undefined`: drawer closed. `null`: adding a new alert.
  const [editing, setEditing] = useState<CqcAlert | null | undefined>(undefined);

  const fetcher = useCallback<PagedFetcher<CqcAlert>>(
    (params, signal) => cqcApi.alerts(PUBLIC_SUB_APP_ID, practice.id, params, signal),
    [practice.id],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    errorText: 'Could not load the alert register.',
    errorToast: 'Failed to load the alert register',
  });

  const columns: DataTableColumn<CqcAlert>[] = [
    {
      id: 'alert',
      label: 'Alert',
      render: (row) => (
        <>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{row.title}</Typography>
          <Typography variant="caption">{row.reference}</Typography>
        </>
      ),
    },
    {
      id: 'received',
      label: 'Received',
      align: 'center',
      render: (row) => (row.received_date ? formatDate(row.received_date) : '-'),
    },
    {
      id: 'applicable',
      label: 'Applicable?',
      align: 'center',
      render: (row) => <StatusChip status={CQC_APPLICABLE_LABELS[row.applicable]} variant="outlined" />,
    },
    { id: 'owner', label: 'Clinical Owner', render: (row) => row.clinical_owner || '-' },
    {
      id: 'deadline',
      label: 'Action Deadline',
      align: 'center',
      render: (row) => (
        <DueDate
          date={row.action_deadline}
          resolved={row.action_status === 'COMPLETE' || row.action_status === 'NOT_APPLICABLE'}
        />
      ),
    },
    { id: 'patients', label: 'Patients / Items', align: 'center', render: (row) => row.patients_affected ?? '-' },
    {
      id: 'action',
      label: 'Action Completed',
      align: 'center',
      render: (row) => <StatusChip status={CQC_ALERT_ACTION_LABELS[row.action_status]} variant="outlined" />,
    },
    {
      id: 'signoff',
      label: 'Sign-off',
      align: 'center',
      render: (row) => <StatusChip status={CQC_SIGN_OFF_LABELS[row.sign_off]} variant="outlined" />,
    },
    {
      id: 'view',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <IconButton aria-label={`View ${row.reference}`} onClick={() => setEditing(row)} sx={{ color: 'primary.main' }}>
          <VisibilityOutlined fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography component="h3" variant="h6">
          Alert Register
        </Typography>
        <Button variant="contained" startIcon={<AddCircleOutlineOutlined />} onClick={() => setEditing(null)}>
          Add Alert
        </Button>
      </Stack>
      <DataTable<CqcAlert>
        aria-label="CAS alert register"
        columns={columns}
        rows={list.rows}
        getRowId={(row) => row.id}
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage="No alerts found. Add the first alert."
        minWidth={980}
      />
      <AlertDrawer
        open={editing !== undefined}
        alert={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          list.reload();
        }}
      />
    </Stack>
  );
}
