'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DataTable } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatusChip } from '@/components/data/StatusChip';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { ComingSoonPlaceholder } from '@/components/feedback/ComingSoonPlaceholder';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { ConfirmDialog, type ConfirmVariant } from '@/components/modals/ConfirmDialog';
import { FieldLabel, FormDrawer } from '@/components/modals/FormDrawer';
import { FormModal } from '@/components/modals/FormModal';
import { ActionMenu } from '@/components/navigation/ActionMenu';
import { PillTabs } from '@/components/navigation/PillTabs';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { ViewModeToggle, type ViewMode } from '@/components/navigation/ViewModeToggle';
import { EntityAvatar } from '@/components/primitives/EntityAvatar';
import { GoBackLink } from '@/components/primitives/GoBackLink';
import { API_MODE } from '@/lib/api/config';

// Dev-only gallery of the shared components (approved in the phase 2 plan). Not part of the app.

interface SampleRow {
  id: string;
  name: string;
  manager: string;
  users: number;
  added: string;
  incomplete: boolean;
}

const SAMPLE_ROWS: SampleRow[] = Array.from({ length: 23 }, (_, index) => ({
  id: String(index),
  name: ['Ashford Medical Centre', 'Barnwell Surgery', 'Brookfield Health Centre', 'Castleton Family Practice'][
    index % 4
  ],
  manager: index % 3 === 0 ? '—' : ['Jordan Hale', 'Priya Nair', 'Tom Ellis'][index % 3],
  users: (index * 7) % 50,
  added: `2026-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 27) + 1).padStart(2, '0')}`,
  incomplete: index % 5 === 0,
}));

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 5 }}>
      <Typography variant="sectionTitle" component="h2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default function ComponentGallery() {
  const [pill, setPill] = useState<'list' | 'archived'>('list');
  const [segment, setSegment] = useState<'staff' | 'bidding' | 'activity'>('staff');
  const [brandSegment, setBrandSegment] = useState<'standard' | 'staff'>('standard');
  const [view, setView] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Record<string, string>>({ role: '', status: '' });
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('-added');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tableState, setTableState] = useState<'data' | 'loading' | 'empty' | 'error'>('data');
  const [modalOpen, setModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [active, setActive] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmVariant | null>(null);

  const rows = useMemo(() => {
    const key = ordering.replace(/^-/, '') as keyof SampleRow;
    const sorted = [...SAMPLE_ROWS]
      .filter((row) => row.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));
    return ordering.startsWith('-') ? sorted.reverse() : sorted;
  }, [ordering, search]);

  if (API_MODE !== 'mock') return <AccessDenied backHref="/" backLabel="Go home" title="Not available" />;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="moduleTitle" component="h1" sx={{ mb: 1 }}>
        Component gallery
      </Typography>
      <Typography variant="body2" sx={{ mb: 4 }}>
        Shared building blocks from COMPONENTS.md, with demo data. Mock mode only.
      </Typography>

      <Section title="Buttons, chips and avatars">
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5, mb: 2 }}>
          <Button variant="contained" startIcon={<AddCircleOutline />} sx={{ borderRadius: 999 }}>
            Onboard New Practice
          </Button>
          <Button variant="outlined">Cancel</Button>
          <Button variant="contained" color="brand">
            Add Template
          </Button>
          <GoBackLink onClick={() => undefined} />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mb: 2 }}>
          {[
            'Active',
            'Inactive',
            'Pending Invite',
            'Pending Verification',
            'Invitation Expired',
            'Locked',
            'Draft',
            '',
          ].map((status) => (
            <StatusChip key={status || 'empty'} status={status} />
          ))}
          <StatusChip status="Pending Approval" variant="outlined" />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <EntityAvatar name="Ashford Medical Centre" />
          <EntityAvatar name="Riverside" size={56} />
          <EntityAvatar name="Aqlios" logoSrc="/aqlios_logo.svg" framed borderRadius={12} size={56} />
          <ActionMenu
            aria-label="Open actions for Testing"
            items={[
              { label: 'View Details', icon: <VisibilityOutlined fontSize="small" />, onClick: () => undefined },
              { label: 'Edit Template', icon: <EditOutlined fontSize="small" />, onClick: () => undefined },
              { label: 'Mark as Inactive', tone: 'warning', onClick: () => undefined },
              {
                label: 'Delete Template',
                tone: 'danger',
                icon: <DeleteOutline fontSize="small" />,
                onClick: () => setConfirm('error'),
              },
            ]}
          />
        </Stack>
      </Section>

      <Section title="Tabs">
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <PillTabs
            aria-label="Practice lists"
            value={pill}
            onChange={setPill}
            tabs={[
              { value: 'list', label: 'Practice List' },
              { value: 'archived', label: 'Archived Practice' },
            ]}
          />
          <SegmentedTabs
            aria-label="ROTA sections"
            value={segment}
            onChange={setSegment}
            items={[
              { value: 'staff', label: 'Staff Rota', icon: <CalendarMonthOutlined /> },
              { value: 'bidding', label: 'Shift Bidding', icon: <GroupsOutlined /> },
              { value: 'activity', label: 'Activity Tracker', icon: <ScheduleOutlined /> },
            ]}
          />
          <SegmentedTabs
            aria-label="Template lists"
            tone="brand"
            size="small"
            value={brandSegment}
            onChange={setBrandSegment}
            items={[
              { value: 'standard', label: 'Standard Templates' },
              { value: 'staff', label: 'Staff Created Templates' },
            ]}
          />
          <ViewModeToggle value={view} onChange={setView} />
        </Stack>
      </Section>

      <Section title="Page anatomy, filters and table">
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {(['data', 'loading', 'empty', 'error'] as const).map((state) => (
            <Button
              key={state}
              size="small"
              variant={tableState === state ? 'contained' : 'outlined'}
              onClick={() => setTableState(state)}
            >
              Table: {state}
            </Button>
          ))}
        </Stack>
        <HubManagementLayout
          hubManagementBreadcrumbs={[
            { label: 'Practice Management', href: '/dev/components' },
            { label: 'Practice List' },
          ]}
        >
          <ModulePageHeader
            icon={<PersonAddAltOutlined />}
            title="Practice Management"
            subtitle="Practice List"
            actions={
              <Button variant="contained" startIcon={<AddCircleOutline />} sx={{ borderRadius: 999 }}>
                Onboard New Practice
              </Button>
            }
          />
          <Stack spacing={2}>
            <FilterBar
              filters={[
                {
                  id: 'role',
                  label: 'Role',
                  allLabel: 'All Roles',
                  options: ['Clinician', 'Nurse', 'Practice Manager'].map((value) => ({ value, label: value })),
                },
                {
                  id: 'status',
                  label: 'Status',
                  allLabel: 'All Statuses',
                  options: ['Active', 'Inactive'].map((value) => ({ value, label: value })),
                },
              ]}
              values={filters}
              onChange={(id, value) => setFilters((current) => ({ ...current, [id]: value }))}
              search={{ value: search, onChange: setSearch, placeholder: 'Search by practice name' }}
              onClear={() => {
                setFilters({ role: '', status: '' });
                setSearch('');
              }}
              onRefresh={() => undefined}
            />
            <DataTable<SampleRow>
              aria-label="Practices"
              columns={[
                { id: 'name', label: 'Practice Name', render: (row) => row.name },
                { id: 'manager', label: 'Practice Manager', render: (row) => row.manager },
                { id: 'users', label: 'No. of Users', sortKey: 'users', render: (row) => row.users },
                {
                  id: 'added',
                  label: 'Date Added',
                  sortKey: 'added',
                  render: (row) => row.added.split('-').reverse().join('/'),
                },
                {
                  id: 'actions',
                  label: 'Actions',
                  align: 'center',
                  render: (row) => (
                    <Button size="small" aria-label={`View ${row.name}`} sx={{ minWidth: 0 }}>
                      <VisibilityOutlined fontSize="small" />
                    </Button>
                  ),
                },
              ]}
              rows={tableState === 'data' ? rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : []}
              getRowId={(row) => row.id}
              getRowState={(row) => (row.incomplete ? 'incomplete' : undefined)}
              incompleteLabel="Practice profile is incomplete"
              ordering={ordering}
              onOrderingChange={setOrdering}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={tableState === 'data' ? rows.length : 0}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(0);
              }}
              loading={tableState === 'loading'}
              error={tableState === 'error' ? 'Could not load practices.' : null}
              emptyMessage="No practices found. Try another search."
            />
          </Stack>
        </HubManagementLayout>
      </Section>

      <Section title="Dialogs">
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
          <Button variant="outlined" onClick={() => setModalOpen(true)}>
            FormModal (Create Rota Group)
          </Button>
          <Button variant="outlined" onClick={() => setDrawerOpen(true)}>
            FormDrawer (Add Competency)
          </Button>
          {(['error', 'warning', 'success', 'primary'] as const).map((variant) => (
            <Button key={variant} variant="outlined" onClick={() => setConfirm(variant)}>
              ConfirmDialog: {variant}
            </Button>
          ))}
        </Stack>
      </Section>

      <Section title="States">
        <Stack spacing={2}>
          <Box sx={(theme) => ({ bgcolor: theme.tokens.surface.panel, borderRadius: 3 })}>
            <ComingSoonPlaceholder title="Payroll" />
          </Box>
          <LoadingSpinner message="Loading practices..." />
          <AccessDenied backHref="/dev/components" backLabel="Go to my practices" />
        </Stack>
      </Section>

      <FormModal
        open={modalOpen}
        title="Create Rota Group"
        subtitle="Add basic information and select practices and staff to create a rota group."
        onClose={() => setModalOpen(false)}
        onSubmit={() => setModalOpen(false)}
        submitLabel="Create Group"
        submitIcon={<CalendarMonthOutlined />}
        submitDisabled={!groupName.trim()}
      >
        <TextField
          label="Group Name"
          required
          placeholder="e.g. North London Emergency Pool"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
        />
        <Box
          sx={(theme) => ({
            p: 1.5,
            borderRadius: '8px',
            bgcolor: theme.tokens.surface.subtleFill,
            border: `1px solid ${theme.tokens.border.medium}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          })}
        >
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Active Status</Typography>
            <Typography variant="caption">Set this rota group as active or inactive</Typography>
          </Box>
          <Switch
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            slotProps={{ input: { 'aria-label': 'Active Status' } }}
          />
        </Box>
      </FormModal>

      <FormDrawer
        open={drawerOpen}
        title="Add Competency"
        subtitle="Define a competency type and its associated sub-types."
        onClose={() => setDrawerOpen(false)}
        onSubmit={() => setDrawerOpen(false)}
        submitLabel="Save Competency"
      >
        <Box>
          <FieldLabel htmlFor="competency-name" required>
            Competency Type Name
          </FieldLabel>
          <TextField id="competency-name" placeholder="e.g. Respiratory" />
        </Box>
        <Box>
          <FieldLabel htmlFor="competency-description">Description (optional)</FieldLabel>
          <TextField id="competency-description" placeholder="Describe this competency type..." multiline minRows={3} />
        </Box>
      </FormDrawer>

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === 'error'
            ? 'Delete Assignment'
            : confirm === 'warning'
              ? 'Archive patient'
              : confirm === 'success'
                ? 'Approve Leave Request'
                : 'Claim Shift'
        }
        message={
          confirm === 'error'
            ? 'Are you sure you want to delete this assignment?'
            : confirm === 'warning'
              ? 'Archive Sam Example? They will be moved out of the active patient list.'
              : confirm === 'success'
                ? 'Approve a pending leave request.'
                : 'Are you sure you want to claim this shift?'
        }
        warning={confirm === 'warning' ? 'Archived patients can no longer be managed from this list.' : undefined}
        confirmButtonText={
          confirm === 'error'
            ? 'Delete'
            : confirm === 'warning'
              ? 'Archive'
              : confirm === 'success'
                ? 'Approve'
                : 'Claim'
        }
        confirmButtonVariant={confirm ?? 'error'}
        onClose={() => setConfirm(null)}
        onConfirm={() => setConfirm(null)}
      />
    </Box>
  );
}
