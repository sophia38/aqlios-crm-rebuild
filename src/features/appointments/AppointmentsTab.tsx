'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CalendarMonth from '@mui/icons-material/CalendarMonthOutlined';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import EventAvailable from '@mui/icons-material/EventAvailableOutlined';
import PersonOff from '@mui/icons-material/PersonOffOutlined';
import TableRows from '@mui/icons-material/TableRowsOutlined';
import Timelapse from '@mui/icons-material/TimelapseOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DataTable, type DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { StatsStrip } from '@/components/data/StatsStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { patientPath } from '@/features/patients/patientsRoutes';
import { useCurrentPractice, usePracticeHref } from '@/features/practice/PracticeContext';
import { WeekCalendarGrid } from '@/features/rota/components/WeekCalendarGrid';
import { useAssignableStaff } from '@/features/tickets/components/AssignStaffModal';
import {
  APPOINTMENT_KIND_LABELS,
  APPOINTMENT_SEVERITY_LABELS,
  APPOINTMENT_STATUS_LABELS,
  appointmentsApi,
} from '@/lib/api/appointments';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import {
  APPOINTMENT_KINDS,
  APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentListParams,
  type AppointmentSummary,
} from '@/lib/api/types';
import { usePagedList, type PagedFetcher } from '@/lib/usePagedList';
import { formatAppointmentTime, mondayOf, statusColors, weekLabel } from './appointmentFormat';
import { AppointmentBlock } from './components/AppointmentBlock';
import { AppointmentDialog } from './components/AppointmentDialog';

type View = 'calendar' | 'table';
type Range = 'week' | 'day';
type Filters = { type: string; severity: string; staff_id: string; status: string };

const EMPTY_FILTERS: Filters = { type: '', severity: '', staff_id: '', status: '' };

/**
 * Appointment tab (docs/practice/03-appointment.md, plan §3): Calendar View | Table View (kept in
 * `?view=table`), with one set of filters for both. The Date filter picks the day (Table, Day) or the
 * week (Week); empty means today.
 */
export function AppointmentsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view: View = searchParams.get('view') === 'table' ? 'table' : 'calendar';
  const practice = useCurrentPractice();
  const staff = useAssignableStaff(practice.id);
  const [range, setRange] = useState<Range>('week');
  const [date, setDate] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Appointment | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const anchor = date || dayjs().format('YYYY-MM-DD');
  const setFilter = (id: string, value: string) =>
    setFilters((current) => ({
      ...current,
      [id]: value,
      // Severity belongs to a type: changing the type clears it.
      ...(id === 'type' ? { severity: '' } : {}),
    }));
  const query: AppointmentListParams = { ...filters, search: search.trim() || undefined };

  const switchView = (next: View) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'table') params.set('view', 'table');
    else params.delete('view');
    const text = params.toString();
    router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
  };

  const datePlaceholder = view === 'table' ? 'Today' : range === 'day' ? 'This day' : 'This week';

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
        <SegmentedTabs<View>
          aria-label="Calendar or table view"
          value={view}
          onChange={switchView}
          items={[
            { value: 'calendar', label: 'Calendar View', icon: <CalendarMonth /> },
            { value: 'table', label: 'Table View', icon: <TableRows /> },
          ]}
        />
      </Stack>

      {view === 'calendar' && (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconButton
              aria-label={range === 'day' ? 'Previous day' : 'Previous week'}
              onClick={() => setDate(dayjs(anchor).subtract(1, range).format('YYYY-MM-DD'))}
            >
              <ChevronLeft />
            </IconButton>
            <Box
              aria-live="polite"
              sx={(theme) => ({
                px: 2,
                py: 0.75,
                fontSize: 14,
                fontWeight: 600,
                bgcolor: 'background.paper',
                borderRadius: `${theme.tokens.radius.pill}px`,
                border: `1px solid ${theme.tokens.border.medium}`,
              })}
            >
              {range === 'day' ? dayjs(anchor).format('D MMM YYYY') : weekLabel(mondayOf(anchor))}
            </Box>
            <IconButton
              aria-label={range === 'day' ? 'Next day' : 'Next week'}
              onClick={() => setDate(dayjs(anchor).add(1, range).format('YYYY-MM-DD'))}
            >
              <ChevronRight />
            </IconButton>
          </Stack>
          <SegmentedTabs<Range>
            aria-label="Day or week"
            size="small"
            value={range}
            onChange={setRange}
            items={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
            ]}
          />
        </Stack>
      )}

      <FilterBar
        filters={[
          {
            id: 'type',
            label: 'Appointment Type',
            allLabel: 'All Types',
            options: APPOINTMENT_KINDS.map((kind) => ({ value: kind, label: APPOINTMENT_KIND_LABELS[kind] })),
          },
          {
            id: 'severity',
            label: 'Severity',
            allLabel: 'All Severities',
            disabled: !filters.type,
            disabledLabel: 'Select type first',
            options: (['URGENT', 'ROUTINE'] as const).map((value) => ({
              value,
              label: APPOINTMENT_SEVERITY_LABELS[value],
            })),
          },
          {
            id: 'staff_id',
            label: 'Staff',
            allLabel: 'All Staff',
            options: (staff ?? []).map((member) => ({ value: member.id, label: member.name })),
          },
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All Status',
            options: APPOINTMENT_STATUSES.map((status) => ({
              value: status,
              label: APPOINTMENT_STATUS_LABELS[status],
            })),
          },
        ]}
        values={{ ...filters, date }}
        onChange={setFilter}
        search={{
          value: search,
          onChange: setSearch,
          label: 'Search',
          placeholder: 'Search by name, email or phone',
        }}
        onClear={() => {
          setFilters(EMPTY_FILTERS);
          setSearch('');
          setDate('');
        }}
      >
        <DatePicker
          // The field always shows DD/MM/YYYY, so the captured placeholder ("This week") goes in the label.
          label={date ? 'Date' : `Date: ${datePlaceholder}`}
          value={date ? dayjs(date) : null}
          format="DD/MM/YYYY"
          onChange={(next) => {
            if (next === null) setDate('');
            else if (next.isValid()) setDate(next.format('YYYY-MM-DD'));
          }}
          slotProps={{
            textField: {
              size: 'small',
              slotProps: { inputLabel: { shrink: true } },
              sx: { width: 180, '& .MuiPickersInputBase-root': { fontSize: 13 } },
            },
            field: { clearable: true },
          }}
        />
      </FilterBar>

      {view === 'calendar' ? (
        <AppointmentCalendar
          practiceId={practice.id}
          days={
            range === 'day'
              ? [anchor]
              : Array.from({ length: 7 }, (_, offset) => mondayOf(anchor).add(offset, 'day').format('YYYY-MM-DD'))
          }
          query={
            range === 'day'
              ? { ...query, date: anchor }
              : { ...query, week_start: mondayOf(anchor).format('YYYY-MM-DD') }
          }
          reloadKey={reloadKey}
          onOpen={setOpen}
          onShowDay={(day) => {
            setDate(day);
            setRange('day');
          }}
        />
      ) : (
        // A fresh table when the filters change, so paging starts again.
        <AppointmentTable
          key={JSON.stringify({ query, date })}
          practiceId={practice.id}
          query={{ ...query, date: anchor }}
          reloadKey={reloadKey}
          onOpen={setOpen}
        />
      )}

      <AppointmentDialog
        appointment={open}
        onClose={() => setOpen(null)}
        onChanged={(saved) => {
          setOpen(saved);
          setReloadKey((key) => key + 1);
        }}
      />
    </Stack>
  );
}

function AppointmentCalendar({
  practiceId,
  days,
  query,
  reloadKey,
  onOpen,
  onShowDay,
}: {
  practiceId: string;
  days: string[];
  query: AppointmentListParams;
  reloadKey: number;
  onOpen: (appointment: Appointment) => void;
  onShowDay: (date: string) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const key = JSON.stringify(query);
  const [state, setState] = useState<{ key: string; items: Appointment[] } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    appointmentsApi
      .list(PUBLIC_SUB_APP_ID, practiceId, { ...JSON.parse(key), page_size: 100 }, controller.signal)
      .then((response) => setState({ key, items: response.results }))
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ key, items: [] });
        enqueueSnackbar('Failed to load appointments', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, key, reloadKey, enqueueSnackbar]);

  const loading = state?.key !== key;
  const items = state?.items ?? [];

  return (
    <Box>
      <Box sx={{ height: 4, mb: 1 }}>{loading && <LinearProgress aria-label="Loading appointments" />}</Box>
      {!loading && items.length === 0 && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          No appointments for this period
        </Typography>
      )}
      <WeekCalendarGrid<Appointment>
        aria-label="Appointment calendar"
        days={days}
        events={items}
        loading={loading}
        renderEvent={(appointment, { compact }) => (
          <AppointmentBlock appointment={appointment} compact={compact} onClick={onOpen} />
        )}
        onShowDay={onShowDay}
      />
    </Box>
  );
}

function AppointmentTable({
  practiceId,
  query,
  reloadKey,
  onOpen,
}: {
  practiceId: string;
  query: AppointmentListParams;
  reloadKey: number;
  onOpen: (appointment: Appointment) => void;
}) {
  const theme = useTheme();
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  const key = JSON.stringify(query);
  const [summary, setSummary] = useState<AppointmentSummary | null>(null);

  // The filters go last: the pager's own (empty) `search` must not replace ours.
  const fetcher = useCallback<PagedFetcher<Appointment>>(
    (params, signal) => appointmentsApi.list(PUBLIC_SUB_APP_ID, practiceId, { ...params, ...JSON.parse(key) }, signal),
    [practiceId, key],
  );
  const list = usePagedList(fetcher, {
    pageSize: 10,
    ordering: 'start',
    errorText: 'Could not load appointments.',
    errorToast: 'Failed to load appointments',
  });
  const { reload } = list;

  useEffect(() => {
    const controller = new AbortController();
    appointmentsApi
      .summary(PUBLIC_SUB_APP_ID, practiceId, JSON.parse(key), controller.signal)
      .then(setSummary)
      .catch(() => {
        if (!controller.signal.aborted) enqueueSnackbar('Failed to load appointment totals', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, key, reloadKey, enqueueSnackbar]);

  // A change in the popup refreshes the rows as well as the totals.
  useEffect(() => {
    if (reloadKey) reload();
  }, [reloadKey, reload]);

  const card = (label: string, value: number, status: Appointment['status'], icon: React.ReactNode) => {
    const colors = statusColors(theme, status);
    return { label, value, color: colors.main, tint: colors.bg, icon };
  };

  const columns: DataTableColumn<Appointment>[] = [
    {
      id: 'patient',
      label: 'Patient Name',
      render: (appointment) => (
        <Box
          component={Link}
          href={practiceHref(patientPath(appointment.patient_id))}
          sx={{ color: 'text.primary', fontWeight: 500, whiteSpace: 'nowrap' }}
        >
          {appointment.patient_name}
        </Box>
      ),
    },
    {
      id: 'request',
      label: 'Request Name',
      render: (appointment) => <Box sx={{ minWidth: 160, maxWidth: 240 }}>{appointment.request_name}</Box>,
    },
    {
      id: 'time',
      label: 'Appointment Time',
      sortKey: 'start',
      render: (appointment) => <Box sx={{ whiteSpace: 'nowrap' }}>{formatAppointmentTime(appointment)}</Box>,
    },
    {
      id: 'type',
      label: 'Type',
      render: (appointment) => <Box sx={{ minWidth: 110 }}>{APPOINTMENT_KIND_LABELS[appointment.type]}</Box>,
    },
    {
      id: 'status',
      label: 'Status',
      render: (appointment) => <StatusChip status={APPOINTMENT_STATUS_LABELS[appointment.status]} />,
    },
    {
      id: 'duration',
      label: 'Duration',
      render: (appointment) => <Box sx={{ whiteSpace: 'nowrap' }}>{appointment.duration_minutes} min</Box>,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (appointment) => (
        <Tooltip title="View appointment">
          <IconButton
            aria-label={`View appointment for ${appointment.patient_name}`}
            size="small"
            onClick={() => onOpen(appointment)}
            sx={{ color: 'primary.main' }}
          >
            <VisibilityOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const filtered = Object.entries(JSON.parse(key)).some(([name, value]) => name !== 'date' && Boolean(value));

  return (
    <>
      <StatsStrip
        variant="pill"
        items={[
          card('Upcoming Appointments', summary?.upcoming ?? 0, 'UPCOMING', <EventAvailable />),
          card('In Progress Appointments', summary?.in_progress ?? 0, 'IN_PROGRESS', <Timelapse />),
          card('DNA', summary?.dna ?? 0, 'DNA', <PersonOff />),
          card('Completed Appointments', summary?.completed ?? 0, 'COMPLETED', <CheckCircleOutline />),
          card('Cancelled Appointments', summary?.cancelled ?? 0, 'CANCELLED_BY_STAFF', <CancelOutlined />),
        ]}
      />
      <DataTable
        aria-label="Appointments"
        columns={columns}
        rows={list.rows}
        getRowId={(appointment) => appointment.id}
        ordering={list.query.ordering}
        onOrderingChange={list.setOrdering}
        page={list.query.page}
        rowsPerPage={list.query.pageSize}
        totalCount={list.count}
        onPageChange={list.setPage}
        onRowsPerPageChange={list.setPageSize}
        loading={list.loading}
        error={list.error}
        emptyMessage={filtered ? 'No appointments found. Try another search.' : 'No appointments for this period'}
        minWidth={900}
      />
    </>
  );
}
