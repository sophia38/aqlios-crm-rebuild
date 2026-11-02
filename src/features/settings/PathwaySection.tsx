'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { DataTableColumn } from '@/components/data/DataTable';
import { FilterBar } from '@/components/data/FilterBar';
import { GroupedDataTable, type TableGroup } from '@/components/data/GroupedDataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { AppSwitch } from '@/components/forms/AppSwitch';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { settingsApi } from '@/lib/api/settings';
import type { Pathway, PathwayChannel } from '@/lib/api/types';

const CHANNELS: { key: PathwayChannel; label: string }[] = [
  { key: 'mobile_app', label: 'Mobile App' },
  { key: 'web_app', label: 'Web App' },
  { key: 'voice_agent', label: 'Voice Agent' },
  { key: 'website', label: 'Website' },
  { key: 'care_navigator', label: 'Care Navigator' },
];

const STATUS_LABEL: Record<Pathway['status'], string> = { ACTIVE: 'Active', DRAFT: 'Draft', ARCHIVED: 'Archived' };
const EMPTY_FILTERS = { type: '', status: '', channel: '', routing: '' };

/** Pathway Configuration (docs/super-admin/09-settings.md §4). Channel switches save straight away. */
export function PathwaySection() {
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    settingsApi
      .pathways(PUBLIC_SUB_APP_ID, { ...filters, search: search.trim() || undefined }, controller.signal)
      .then((result) => {
        setRows(result);
        setError(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError('Could not load pathways.');
        enqueueSnackbar('Failed to load pathways', { variant: 'error' });
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [filters, search, reloadKey, enqueueSnackbar]);

  const setChannel = (pathway: Pathway, channel: PathwayChannel, enabled: boolean) => {
    const key = `${pathway.id}:${channel}`;
    const apply = (value: boolean) =>
      setRows((current) =>
        current.map((row) =>
          row.id === pathway.id ? { ...row, channels: { ...row.channels, [channel]: value } } : row,
        ),
      );
    const label = CHANNELS.find((item) => item.key === channel)?.label ?? channel;
    apply(enabled);
    setSaving((current) => new Set(current).add(key));
    settingsApi
      .setPathwayChannel(PUBLIC_SUB_APP_ID, pathway.id, channel, enabled)
      .then(() =>
        enqueueSnackbar(`${label} turned ${enabled ? 'on' : 'off'} for ${pathway.name}`, { variant: 'success' }),
      )
      .catch(() => {
        apply(!enabled);
        enqueueSnackbar(`Failed to update ${label} for ${pathway.name}`, { variant: 'error' });
      })
      .finally(() =>
        setSaving((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        }),
      );
  };

  const groups: TableGroup<Pathway>[] = [];
  for (const row of rows) {
    let group = groups.find((item) => item.id === row.specialty);
    if (!group) {
      group = { id: row.specialty, title: row.specialty, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }
  for (const group of groups) {
    group.summary = `${group.rows.filter((row) => row.status === 'ACTIVE').length} of ${group.rows.length} active`;
  }

  const columns: DataTableColumn<Pathway>[] = [
    {
      id: 'name',
      label: 'Pathway',
      width: 280,
      render: (row) => <Typography sx={{ fontSize: 14, color: 'text.primary' }}>{row.name}</Typography>,
    },
    { id: 'type', label: 'Type', render: (row) => (row.type === 'CLINICAL' ? 'Clinical' : 'Administrative') },
    {
      id: 'status',
      label: 'Status',
      render: (row) => <StatusChip status={STATUS_LABEL[row.status]} variant="outlined" />,
    },
    ...CHANNELS.map<DataTableColumn<Pathway>>((channel) => ({
      id: channel.key,
      label: channel.label,
      align: 'center',
      render: (row) =>
        row.status === 'DRAFT' ? (
          <Typography aria-label="Not available for drafts" sx={{ color: 'text.secondary' }}>
            —
          </Typography>
        ) : (
          <AppSwitch
            checked={row.channels[channel.key]}
            disabled={row.status !== 'ACTIVE' || saving.has(`${row.id}:${channel.key}`)}
            onChange={(event) => setChannel(row, channel.key, event.target.checked)}
            slotProps={{ input: { 'aria-label': `${channel.label} for ${row.name}` } }}
          />
        ),
    })),
    { id: 'routing', label: 'Routing', render: (row) => (row.routing === 'HUB' ? 'Hub' : 'Practice') },
    {
      id: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <Button
          size="small"
          variant="text"
          aria-label={`Configure ${row.name}`}
          onClick={() =>
            enqueueSnackbar('Pathway configuration is rebuilt once its screen has been captured.', { variant: 'info' })
          }
        >
          Configure
        </Button>
      ),
    },
  ];

  const option = (value: string, label: string) => ({ value, label });

  return (
    <Stack spacing={2}>
      <FilterBar
        filters={[
          {
            id: 'type',
            label: 'Type',
            allLabel: 'All',
            options: [option('CLINICAL', 'Clinical'), option('ADMINISTRATIVE', 'Administrative')],
          },
          {
            id: 'status',
            label: 'Status',
            allLabel: 'All',
            options: [option('ACTIVE', 'Active'), option('DRAFT', 'Draft'), option('ARCHIVED', 'Archived')],
          },
          { id: 'channel', label: 'Channel', allLabel: 'All', options: CHANNELS.map((c) => option(c.key, c.label)) },
          {
            id: 'routing',
            label: 'Routing',
            allLabel: 'All',
            options: [option('HUB', 'Hub'), option('PRACTICE', 'Practice')],
          },
        ]}
        values={filters}
        onChange={(id, value) => {
          setLoading(true);
          setFilters((current) => ({ ...current, [id]: value }));
        }}
        search={{
          value: search,
          onChange: (value) => {
            setLoading(true);
            setSearch(value);
          },
          placeholder: 'Search here..',
          label: 'Search',
        }}
        onClear={() => {
          setLoading(true);
          setSearch('');
          setFilters(EMPTY_FILTERS);
        }}
        onRefresh={() => {
          setLoading(true);
          setReloadKey((key) => key + 1);
        }}
        refreshing={loading}
      />
      <GroupedDataTable<Pathway>
        aria-label="Pathways"
        groups={groups}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        error={error}
        emptyMessage="No pathways found. Try another search."
        minWidth={1200}
      />
    </Stack>
  );
}
