'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Add from '@mui/icons-material/Add';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import CalendarViewWeekOutlined from '@mui/icons-material/CalendarViewWeekOutlined';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import DownloadOutlined from '@mui/icons-material/DownloadOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { FilterBar } from '@/components/data/FilterBar';
import { PracticeFilterSelect, type PracticeOption } from '@/components/data/PracticeFilterSelect';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { DUTY_TYPE_LABELS, rotaApi } from '@/lib/api/rota';
import type { DutyType, GapKind, RotaGroupDetail, RotaPractice, RotaStaff, RotaWeek, Shift } from '@/lib/api/types';
import { useRoles } from '@/lib/useRoles';
import { CapacityCard } from './components/CapacityCard';
import { RotaLegend } from './components/RotaLegend';
import { WeekCalendarGrid } from './components/WeekCalendarGrid';

type View = 'practice' | 'staff';
type Range = 'week' | 'day';

const GAP_OPTIONS: { value: GapKind; label: string }[] = [
  { value: 'holiday', label: 'Holidays' },
  { value: 'leave', label: 'Leaves' },
  { value: 'published', label: 'Published Slots' },
];
const ALL_GAPS = GAP_OPTIONS.map((option) => option.value);
const EMPTY_FILTERS = { staff_id: '', staff_type: '', duty_type: '', role_id: '', rota_group_id: '' };
const PHASE_5 = 'This is rebuilt in phase 5, together with practice-level ROTA.';

const mondayOf = (date: string) => dayjs(date).subtract((dayjs(date).day() + 6) % 7, 'day');

function weekLabel(start: dayjs.Dayjs) {
  const end = start.add(6, 'day');
  return start.month() === end.month()
    ? `${start.format('D')} - ${end.format('D MMM YYYY')}`
    : `${start.format('D MMM')} - ${end.format('D MMM YYYY')}`;
}

const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

/** Downloads the visible shifts as CSV (approved: the live file format wasn't captured). */
function downloadCsv(shifts: Shift[], name: string) {
  const rows = [
    ['Date', 'Staff', 'Role', 'Contract', 'Practice', 'Start', 'End', 'Duty Type'],
    ...shifts.map((shift) => [
      dayjs(shift.date).format('DD/MM/YYYY'),
      shift.staff_name,
      shift.role_name,
      shift.staff_type === 'LOCUM' ? 'Locum' : 'Salaried',
      shift.practice_name,
      shift.start_time,
      shift.end_time,
      DUTY_TYPE_LABELS[shift.duty_type],
    ]),
  ];
  const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Rota Management tab (docs/super-admin/06-rota-management.md, Tab 1). */
export function RotaManagementTab() {
  const { enqueueSnackbar } = useSnackbar();
  const roles = useRoles();
  const [view, setView] = useState<View>('practice');
  const [range, setRange] = useState<Range>('week');
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [practice, setPractice] = useState<PracticeOption | null>(null);
  const [show, setShow] = useState<GapKind[]>(ALL_GAPS);
  const [panelOpen, setPanelOpen] = useState(true);
  const [week, setWeek] = useState<RotaWeek>({ shifts: [], gaps: [] });
  const [practices, setPractices] = useState<RotaPractice[]>([]);
  const [staff, setStaff] = useState<RotaStaff[]>([]);
  const [groups, setGroups] = useState<RotaGroupDetail[]>([]);
  // The rota is loading until the last finished request matches the current week and filters.
  const [loadedKey, setLoadedKey] = useState('');

  const weekStart = mondayOf(date);
  const weekStartText = weekStart.format('YYYY-MM-DD');
  const days = useMemo(
    () =>
      range === 'day'
        ? [date]
        : Array.from({ length: 7 }, (_, index) => mondayOf(date).add(index, 'day').format('YYYY-MM-DD')),
    [range, date],
  );

  useEffect(() => {
    const controller = new AbortController();
    rotaApi
      .groups(PUBLIC_SUB_APP_ID, { status: 'active' }, controller.signal)
      .then(setGroups)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      rotaApi.availablePractices(PUBLIC_SUB_APP_ID, weekStartText, controller.signal),
      rotaApi.availableStaff(PUBLIC_SUB_APP_ID, weekStartText, controller.signal),
    ])
      .then(([practiceList, staffList]) => {
        setPractices(practiceList);
        setStaff(staffList);
      })
      .catch(
        () => !controller.signal.aborted && enqueueSnackbar('Failed to load practices and staff', { variant: 'error' }),
      );
    return () => controller.abort();
  }, [weekStartText, enqueueSnackbar]);

  const requestKey = JSON.stringify([weekStartText, practice?.id ?? '', filters]);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    const key = JSON.stringify([weekStartText, practice?.id ?? '', filters]);
    rotaApi
      .week(PUBLIC_SUB_APP_ID, { week_start: weekStartText, practice_id: practice?.id, ...filters }, controller.signal)
      .then(setWeek)
      .catch(() => !controller.signal.aborted && enqueueSnackbar('Failed to load the rota', { variant: 'error' }))
      .finally(() => !controller.signal.aborted && setLoadedKey(key));
    return () => controller.abort();
  }, [weekStartText, practice, filters, enqueueSnackbar]);

  const setFilter = (id: string, value: string) => setFilters((current) => ({ ...current, [id]: value }));
  const move = (step: number) =>
    setDate((current) =>
      dayjs(current)
        .add(step, range === 'day' ? 'day' : 'week')
        .format('YYYY-MM-DD'),
    );
  const later = () => enqueueSnackbar(PHASE_5, { variant: 'info' });

  const visibleShifts = week.shifts.filter((shift) => days.includes(shift.date));
  const selection = filters.staff_id
    ? staff.find((member) => member.id === filters.staff_id)?.name
    : practice?.practice_name;

  const orderedPractices = [...practices].sort(
    (a, b) => b.assigned_hours - a.assigned_hours || a.practice_name.localeCompare(b.practice_name),
  );
  const staffGroups = roles
    .map((role) => ({ role, members: staff.filter((member) => member.role_id === role.id) }))
    .filter((group) => group.members.length > 0);

  const pill = (theme: { tokens: { radius: { pill: number } } }) => ({ borderRadius: `${theme.tokens.radius.pill}px` });

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CalendarViewWeekOutlined aria-hidden sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography component="h2" variant="pageTitle">
              Hub ROTA Management
            </Typography>
            <Typography variant="body2">{view === 'practice' ? 'Practice View' : 'Staff View'}</Typography>
          </Box>
        </Stack>
        <SegmentedTabs<View>
          aria-label="Rota view"
          value={view}
          onChange={(next) => {
            setView(next);
            setFilters((current) => ({ ...current, staff_id: '' }));
            setPractice(null);
          }}
          items={[
            { value: 'practice', label: 'Practice View' },
            { value: 'staff', label: 'Staff View' },
          ]}
        />
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadOutlined />}
          disabled={!selection}
          onClick={() =>
            downloadCsv(
              visibleShifts,
              `rota-${(selection ?? 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${weekStartText}.csv`,
            )
          }
          sx={pill}
        >
          Download Rota
        </Button>
        <Button variant="outlined" startIcon={<ContentCopyOutlined />} onClick={later} sx={pill}>
          Apply Rota Template
        </Button>
        <Button variant="contained" startIcon={<Add />} onClick={later} sx={pill}>
          Create Rota Template
        </Button>
      </Stack>

      <Box
        sx={(theme) => ({
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.card}px`,
          border: `1px solid ${theme.tokens.border.medium}`,
        })}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5, mb: 2 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <IconButton aria-label={range === 'day' ? 'Previous day' : 'Previous week'} onClick={() => move(-1)}>
              <ChevronLeft />
            </IconButton>
            <Box
              aria-live="polite"
              sx={(theme) => ({
                px: 2,
                py: 0.75,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: `${theme.tokens.radius.pill}px`,
                border: `1px solid ${theme.tokens.border.medium}`,
              })}
            >
              {range === 'day' ? dayjs(date).format('ddd D MMM YYYY') : weekLabel(weekStart)}
            </Box>
            <IconButton aria-label={range === 'day' ? 'Next day' : 'Next week'} onClick={() => move(1)}>
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
        <FilterBar
          filters={[
            {
              id: 'staff_id',
              label: 'Staff',
              allLabel: 'All',
              options: staff.map((member) => ({ value: member.id, label: member.name })),
            },
            {
              id: 'staff_type',
              label: 'Staff Type',
              allLabel: 'All',
              options: [
                { value: 'SALARIED', label: 'Salaried' },
                { value: 'LOCUM', label: 'Locum' },
              ],
            },
            {
              id: 'duty_type',
              label: 'Duty Type',
              allLabel: 'All',
              options: (Object.keys(DUTY_TYPE_LABELS) as DutyType[]).map((key) => ({
                value: key,
                label: DUTY_TYPE_LABELS[key],
              })),
            },
            {
              id: 'role_id',
              label: 'Roles',
              allLabel: 'All',
              options: roles.map((role) => ({ value: role.id, label: role.name })),
            },
            {
              id: 'rota_group_id',
              label: 'Rota Group',
              allLabel: 'All',
              options: groups.map((group) => ({ value: group.id, label: group.name })),
            },
          ]}
          values={{ ...filters, practice: practice?.id ?? '', show: show.length === ALL_GAPS.length ? '' : 'x' }}
          onChange={setFilter}
          onClear={() => {
            setFilters(EMPTY_FILTERS);
            setPractice(null);
            setShow(ALL_GAPS);
          }}
        >
          <PracticeFilterSelect value={practice} onChange={(next) => setPractice(next)} />
          <TextField
            select
            size="small"
            label="Show"
            fullWidth={false}
            value={show.length === ALL_GAPS.length ? ['all'] : show}
            onChange={(event) => {
              const picked = event.target.value as unknown as string[];
              // Choosing All clears the others (live behaviour); clearing everything means All.
              const next =
                picked.at(-1) === 'all' || picked.length === 0
                  ? ALL_GAPS
                  : (picked.filter((value) => value !== 'all') as GapKind[]);
              setShow(next);
            }}
            slotProps={{
              select: {
                multiple: true,
                renderValue: (selected) =>
                  (selected as string[]).includes('all')
                    ? 'All'
                    : (selected as GapKind[])
                        .map((value) => GAP_OPTIONS.find((option) => option.value === value)?.label)
                        .join(', '),
              },
              inputLabel: { shrink: true },
            }}
            sx={{ minWidth: 160, '& .MuiInputBase-root': { fontSize: 13 } }}
          >
            <MenuItem value="all">
              <Checkbox size="small" checked={show.length === ALL_GAPS.length} />
              <ListItemText primary="All" />
            </MenuItem>
            {GAP_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox size="small" checked={show.length < ALL_GAPS.length && show.includes(option.value)} />
                <ListItemText primary={option.label} />
              </MenuItem>
            ))}
          </TextField>
          <DatePicker
            label="Date"
            value={dayjs(date)}
            format="DD/MM/YYYY"
            onChange={(next) => next?.isValid() && setDate(next.format('YYYY-MM-DD'))}
            slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
          />
        </FilterBar>
        <Box sx={{ mt: 2 }}>
          <RotaLegend />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'flex-start' }}>
        <Box
          component="aside"
          aria-label={view === 'practice' ? 'Select Practice' : 'Select Staff'}
          sx={(theme) => ({
            width: { xs: '100%', md: panelOpen ? 240 : 48 },
            flexShrink: 0,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.tokens.border.medium}`,
            borderRadius: `${theme.tokens.radius.input}px`,
            transition: theme.transitions.create('width'),
            opacity: loading ? 0.6 : 1,
          })}
        >
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
            {panelOpen && (
              <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600, pl: 0.5 }}>
                {view === 'practice' ? 'Select Practice' : 'Select Staff'}
              </Typography>
            )}
            <IconButton
              size="small"
              aria-label={panelOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen(!panelOpen)}
            >
              {panelOpen ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
            </IconButton>
          </Stack>
          {panelOpen && (
            <Stack spacing={1} sx={{ p: 1, pt: 0, maxHeight: 640, overflowY: 'auto' }}>
              {view === 'practice' ? (
                <>
                  <ButtonBase
                    onClick={() => setPractice(null)}
                    aria-pressed={!practice}
                    sx={(theme) => ({
                      display: 'block',
                      textAlign: 'left',
                      p: 1.25,
                      borderRadius: `${theme.tokens.radius.input}px`,
                      border: `1px solid ${!practice ? theme.palette.primary.main : theme.tokens.border.medium}`,
                      bgcolor: !practice ? theme.tokens.surface.tealLight : 'background.paper',
                    })}
                  >
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>All Practices</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Show all locations</Typography>
                  </ButtonBase>
                  {orderedPractices.map((item) => (
                    <CapacityCard
                      key={item.id}
                      title={item.practice_name}
                      subtitle={`${item.opening_time} - ${item.closing_time}`}
                      icon={<ApartmentOutlined fontSize="small" />}
                      assigned={item.assigned_hours}
                      total={item.total_hours}
                      selected={practice?.id === item.id}
                      onSelect={() => setPractice({ id: item.id, practice_name: item.practice_name })}
                    />
                  ))}
                </>
              ) : (
                staffGroups.map(({ role, members }) => (
                  <StaffGroup
                    key={role.id}
                    title={`${role.name.trim() || 'Other'}s(${members.length})`}
                    members={members}
                    selectedId={filters.staff_id}
                    onSelect={(id) => setFilter('staff_id', filters.staff_id === id ? '' : id)}
                  />
                ))
              )}
            </Stack>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
          <Box sx={{ height: 4, mb: 1 }}>{loading && <LinearProgress aria-label="Loading rota" />}</Box>
          {!loading && visibleShifts.length === 0 && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              No shifts {range === 'day' ? 'on this day' : 'this week'}.
            </Typography>
          )}
          <WeekCalendarGrid
            days={days}
            shifts={week.shifts}
            gaps={week.gaps}
            showGaps={show}
            loading={loading}
            onSlotClick={later}
            onShiftClick={later}
            onShowDay={(day) => {
              setDate(day);
              setRange('day');
            }}
          />
        </Box>
      </Box>
    </Stack>
  );
}

function StaffGroup({
  title,
  members,
  selectedId,
  onSelect,
}: {
  title: string;
  members: RotaStaff[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Box>
      <ButtonBase
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        sx={{ width: '100%', justifyContent: 'space-between', px: 0.5, py: 0.75 }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{title}</Typography>
        <ExpandMore
          aria-hidden
          sx={(theme) => ({
            fontSize: 18,
            transform: open ? 'none' : 'rotate(-90deg)',
            transition: theme.transitions.create('transform'),
          })}
        />
      </ButtonBase>
      <Collapse in={open}>
        <Stack spacing={1}>
          {members.map((member) => (
            <CapacityCard
              key={member.id}
              title={member.name}
              chip={member.role_name}
              subtitle={member.working_hours}
              assigned={member.assigned_hours}
              total={member.total_hours}
              selected={selectedId === member.id}
              onSelect={() => onSelect(member.id)}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}
