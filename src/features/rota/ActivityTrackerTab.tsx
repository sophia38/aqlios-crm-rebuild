'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { FilterBar } from '@/components/data/FilterBar';
import { PracticeFilterSelect, type PracticeOption } from '@/components/data/PracticeFilterSelect';
import { StatsStrip } from '@/components/data/StatsStrip';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { rotaApi } from '@/lib/api/rota';
import type { RotaStaff, StaffActivityResponse } from '@/lib/api/types';
import { ActivityCard } from './components/ActivityCard';

const EMPTY_FILTERS = { staff_id: '', status: '' };

/** Activity Tracker tab (docs/super-admin/06-rota-management.md, Tab 3). Times are 24-hour (live: 12-hour). */
export function ActivityTrackerTab() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [practice, setPractice] = useState<PracticeOption | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [staff, setStaff] = useState<RotaStaff[]>([]);
  const [data, setData] = useState<StaffActivityResponse | null>(null);
  const [error, setError] = useState(false);
  const [loadedKey, setLoadedKey] = useState('');

  const requestKey = JSON.stringify([date, filters, practice?.id ?? '', search, page, pageSize]);
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    rotaApi
      .availableStaff(PUBLIC_SUB_APP_ID, date, controller.signal)
      .then(setStaff)
      .catch(() => undefined);
    return () => controller.abort();
  }, [date]);

  useEffect(() => {
    const controller = new AbortController();
    const key = JSON.stringify([date, filters, practice?.id ?? '', search, page, pageSize]);
    rotaApi
      .activity(
        PUBLIC_SUB_APP_ID,
        {
          date,
          ...filters,
          practice_id: practice?.id,
          search: search.trim() || undefined,
          page: page + 1,
          page_size: pageSize,
        },
        controller.signal,
      )
      .then((result) => {
        setData(result);
        setError(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        enqueueSnackbar('Failed to load staff activity', { variant: 'error' });
      })
      .finally(() => !controller.signal.aborted && setLoadedKey(key));
    return () => controller.abort();
  }, [date, filters, practice, search, page, pageSize, enqueueSnackbar]);

  const stats = data?.stats ?? { active: 0, inactive: 0, on_leave: 0 };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography component="h2" variant="pageTitle">
          Activity Tracker
        </Typography>
        <Typography variant="body2">Manage and view staff activities here.</Typography>
      </Box>
      <FilterBar
        filters={[
          {
            id: 'staff_id',
            label: 'Staff',
            allLabel: 'All Staff',
            options: staff.map((member) => ({ value: member.id, label: member.name })),
          },
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All Statuses',
            options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'ON_LEAVE', label: 'On Leave' },
            ],
          },
        ]}
        values={{ ...filters, practice: practice?.id ?? '' }}
        onChange={(id, value) => {
          setFilters((current) => ({ ...current, [id]: value }));
          setPage(0);
        }}
        search={{
          value: search,
          onChange: (value) => {
            setSearch(value);
            setPage(0);
          },
          placeholder: 'Search by staff name...',
          label: 'Search',
        }}
        onClear={() => {
          setFilters(EMPTY_FILTERS);
          setPractice(null);
          setSearch('');
          setPage(0);
        }}
      >
        <PracticeFilterSelect
          value={practice}
          allLabel="All Practices"
          onChange={(next) => {
            setPractice(next);
            setPage(0);
          }}
        />
        <DatePicker
          label="Date"
          value={dayjs(date)}
          format="DD/MM/YYYY"
          onChange={(next) => {
            if (!next?.isValid()) return;
            setDate(next.format('YYYY-MM-DD'));
            setPage(0);
          }}
          slotProps={{ textField: { size: 'small', sx: { width: 170 } } }}
        />
      </FilterBar>
      <StatsStrip
        items={[
          { label: 'Active Now', value: stats.active, color: theme.tokens.rota.activity.activeNow },
          { label: 'Inactive', value: stats.inactive, color: theme.tokens.rota.activity.inactive },
          { label: 'On Leave', value: stats.on_leave, color: theme.tokens.rota.activity.onLeave },
        ]}
      />
      <Box
        sx={{
          bgcolor: 'background.paper',
          border: `1px solid ${theme.tokens.border.medium}`,
          borderRadius: `${theme.tokens.radius.card}px`,
          p: 2,
        }}
      >
        {loading ? (
          <Stack spacing={1.5} aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} variant="rounded" height={170} />
            ))}
          </Stack>
        ) : error ? (
          <Typography variant="body2" sx={{ color: 'error.main', textAlign: 'center', py: 6 }}>
            Could not load staff activity.
          </Typography>
        ) : data && data.results.length > 0 ? (
          <Stack spacing={1.5} component="section" aria-label="Staff activity">
            {data.results.map((record) => (
              <ActivityCard key={record.id} record={record} />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 6 }}>
            No staff activity found. Try another search.
          </Typography>
        )}
        <TablePagination
          component="div"
          count={data?.count ?? 0}
          page={page}
          rowsPerPage={pageSize}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, next) => setPage(next)}
          onRowsPerPageChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(0);
          }}
        />
      </Box>
    </Stack>
  );
}
