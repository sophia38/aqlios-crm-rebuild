'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import DriveFileMoveOutlined from '@mui/icons-material/DriveFileMoveOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import PersonOutline from '@mui/icons-material/PersonOutlineOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { FilterBar } from '@/components/data/FilterBar';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import type { ActionMenuItem } from '@/components/navigation/ActionMenu';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { templatesApi } from '@/lib/api/templates';
import { TEMPLATE_CATEGORIES, type CommunicationTemplate, type TemplateListResponse } from '@/lib/api/types';
import { TemplateCard } from './components/TemplateCard';
import { MoveToStandardDialog } from './MoveToStandardDialog';
import { STATUS_LABEL, TYPE_LABEL } from './templateLabels';
import { TemplateFormDialog, type TemplateDialogMode } from './TemplateFormDialog';

type Tab = 'standard' | 'staff';
type ConfirmKind = 'delete' | 'deactivate' | 'activate';

const TAB_PARAM: Record<Tab, string | null> = { standard: null, staff: 'staff-created' };
const EMPTY_FILTERS = { type: '', status: '', created_by: '' };

/** Templates Library (docs/super-admin/10-template-library.md). Card-grid page in one white card. */
export function TemplateLibraryPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  // Fix: the tab is kept in `?tab=`, so it can be linked and survives a refresh (live: no URL change).
  const tab: Tab = searchParams.get('tab') === 'staff-created' ? 'staff' : 'standard';

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [category, setCategory] = useState('');
  const [data, setData] = useState<TemplateListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<{ mode: TemplateDialogMode; template?: CommunicationTemplate } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; template: CommunicationTemplate } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [moving, setMoving] = useState<CommunicationTemplate | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    templatesApi
      .list(
        PUBLIC_SUB_APP_ID,
        { scope: tab, search: search.trim() || undefined, category: category || undefined, ...filters },
        controller.signal,
      )
      .then((result) => {
        setData(result);
        setError(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError(true);
        enqueueSnackbar('Failed to load templates', { variant: 'error' });
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [tab, search, filters, category, reloadKey, enqueueSnackbar]);

  const reload = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const changeTab = (next: Tab) => {
    if (next === tab) return;
    setLoading(true);
    setSearch('');
    setFilters(EMPTY_FILTERS);
    setCategory('');
    const param = TAB_PARAM[next];
    router.replace(param ? `${pathname}?tab=${param}` : pathname, { scroll: false });
  };

  const actionsFor = (template: CommunicationTemplate): ActionMenuItem[] => {
    const view = {
      label: 'View Details',
      icon: <VisibilityOutlined fontSize="small" />,
      onClick: () => setDialog({ mode: 'view', template }),
    };
    const remove: ActionMenuItem = {
      label: 'Delete Template',
      icon: <DeleteOutline fontSize="small" />,
      tone: 'danger',
      onClick: () => setConfirm({ kind: 'delete', template }),
    };
    if (template.scope === 'STAFF') {
      return [
        view,
        {
          label: 'Move to Standard',
          icon: <DriveFileMoveOutlined fontSize="small" />,
          onClick: () => setMoving(template),
        },
        remove,
      ];
    }
    return [
      view,
      {
        label: 'Edit Template',
        icon: <EditOutlined fontSize="small" />,
        onClick: () => setDialog({ mode: 'edit', template }),
      },
      template.status === 'INACTIVE'
        ? {
            label: 'Activate Template',
            icon: <CheckCircleOutline fontSize="small" />,
            onClick: () => setConfirm({ kind: 'activate', template }),
          }
        : {
            label: 'Mark as Inactive',
            icon: <BlockOutlined fontSize="small" />,
            tone: 'warning',
            onClick: () => setConfirm({ kind: 'deactivate', template }),
          },
      remove,
    ];
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, template } = confirm;
    setConfirming(true);
    try {
      if (kind === 'delete') {
        await templatesApi.remove(PUBLIC_SUB_APP_ID, template.id);
        enqueueSnackbar('Template deleted successfully', { variant: 'success' });
      } else {
        await templatesApi.update(PUBLIC_SUB_APP_ID, template.id, {
          status: kind === 'activate' ? 'ACTIVE' : 'INACTIVE',
        });
        enqueueSnackbar(kind === 'activate' ? 'Template activated successfully' : 'Template marked as inactive', {
          variant: 'success',
        });
      }
      setConfirm(null);
      reload();
    } catch {
      enqueueSnackbar(kind === 'delete' ? 'Failed to delete template' : 'Failed to update template status', {
        variant: 'error',
      });
    } finally {
      setConfirming(false);
    }
  };

  const results = data?.results ?? [];
  const totals = data?.totals ?? { standard: 0, staff: 0 };
  const groups = TEMPLATE_CATEGORIES.map((name) => ({
    name,
    items: results.filter((template) => template.category === name),
  })).filter((group) => group.items.length > 0);
  const tabLabel = tab === 'standard' ? 'Standard Templates' : 'Staff Created Templates';

  const confirmCopy =
    confirm &&
    {
      delete: {
        title: 'Delete Template',
        message: <>&quot;{confirm.template.name}&quot; will be permanently deleted.</>,
        button: 'Delete Permanently',
        variant: 'error' as const,
        warning: undefined,
      },
      deactivate: {
        title: 'Mark Template as Inactive',
        message: (
          <>
            &quot;{confirm.template.name}&quot; will be moved to inactive status. Staff will no longer be able to use
            this template.
          </>
        ),
        button: 'Mark as Inactive',
        variant: 'warning' as const,
        warning: 'You can reactivate this template anytime from the Template Library.',
      },
      activate: {
        title: 'Activate Template',
        message: <>&quot;{confirm.template.name}&quot; will be activated and made available to staff.</>,
        button: 'Activate',
        variant: 'brand' as const,
        warning: undefined,
      },
    }[confirm.kind];

  return (
    <HubManagementLayout>
      <ModulePageHeader icon={<DescriptionOutlined />} title="Templates Library" />
      <Box
        sx={(theme) => ({
          bgcolor: 'background.paper',
          border: `1px solid ${theme.tokens.border.medium}`,
          borderRadius: `${theme.tokens.radius.card}px`,
          p: { xs: 2, md: 3 },
        })}
      >
        <Stack spacing={2.5}>
          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, color: 'text.primary' }}>
            Communication Templates ({totals.standard + totals.staff})
          </Typography>
          <SegmentedTabs<Tab>
            aria-label="Template scope"
            tone="brand"
            size="small"
            value={tab}
            onChange={changeTab}
            items={[
              { value: 'standard', label: 'Standard Templates' },
              { value: 'staff', label: 'Staff Created Templates' },
            ]}
          />
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <PersonOutline aria-hidden sx={{ color: 'primary.main' }} />
              <Typography component="h3" sx={{ fontSize: 16, fontWeight: 600, color: 'text.primary' }}>
                {tabLabel} ({tab === 'standard' ? totals.standard : totals.staff})
              </Typography>
            </Stack>
            {tab === 'standard' && (
              <Button
                variant="contained"
                color="brand"
                startIcon={<AddCircleOutline />}
                onClick={() => setDialog({ mode: 'create' })}
                sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
              >
                Add Template
              </Button>
            )}
          </Stack>
          <FilterBar
            hideLabel
            filters={[
              {
                id: 'type',
                label: 'Type',
                allLabel: 'All Types',
                options: (['MESSAGE', 'EMAIL', 'NOTE'] as const).map((value) => ({ value, label: TYPE_LABEL[value] })),
              },
              ...(tab === 'staff'
                ? [
                    {
                      id: 'created_by',
                      label: 'Created By',
                      allLabel: 'Anyone',
                      options: (data?.authors ?? []).map((author) => ({ value: author, label: author })),
                    },
                  ]
                : []),
              {
                id: 'status',
                label: 'Status',
                allLabel: 'All Statuses',
                options: (['ACTIVE', 'INACTIVE', 'DRAFT'] as const).map((value) => ({
                  value,
                  label: STATUS_LABEL[value],
                })),
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
              placeholder: 'Search templates by name...',
              label: 'Search',
            }}
            onClear={() => {
              setLoading(true);
              setSearch('');
              setFilters(EMPTY_FILTERS);
            }}
          />
          <TextField
            select
            label="Template Categories"
            value={category}
            onChange={(event) => {
              setLoading(true);
              setCategory(event.target.value);
            }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {TEMPLATE_CATEGORIES.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </TextField>

          {loading ? (
            <Grid container spacing={2} aria-busy="true" aria-label="Loading templates">
              {Array.from({ length: 4 }, (_, index) => (
                <Grid key={index} size={{ xs: 12, md: 6 }}>
                  <Skeleton variant="rounded" height={150} />
                </Grid>
              ))}
            </Grid>
          ) : error ? (
            <Stack spacing={1.5} sx={{ alignItems: 'center', py: 6 }}>
              <Typography variant="body2" sx={{ color: 'error.main' }}>
                Could not load templates.
              </Typography>
              <Button variant="outlined" onClick={reload}>
                Try again
              </Button>
            </Stack>
          ) : groups.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 6 }}>
              No templates found. Try another search.
            </Typography>
          ) : (
            groups.map((group) => (
              <Box
                key={group.name}
                component="section"
                aria-label={`${group.name} (${group.items.length})`}
                sx={(theme) => ({
                  p: { xs: 1.5, md: 2 },
                  border: `1px solid ${theme.tokens.border.medium}`,
                  borderRadius: `${theme.tokens.radius.base}px`,
                })}
              >
                <Typography component="h3" sx={{ fontSize: 16, fontWeight: 600, color: 'text.primary', mb: 1.5 }}>
                  {group.name} ({group.items.length})
                </Typography>
                <Grid container spacing={2}>
                  {group.items.map((template) => (
                    <Grid key={template.id} size={{ xs: 12, md: 6 }}>
                      <TemplateCard template={template} actions={actionsFor(template)} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))
          )}
        </Stack>
      </Box>

      <TemplateFormDialog
        open={Boolean(dialog)}
        mode={dialog?.mode ?? 'create'}
        template={dialog?.template}
        onClose={() => setDialog(null)}
        onSaved={() => {
          setDialog(null);
          reload();
        }}
      />
      <MoveToStandardDialog
        template={moving}
        onClose={() => setMoving(null)}
        onMoved={() => {
          setMoving(null);
          reload();
        }}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirmCopy?.title ?? ''}
        message={confirmCopy?.message}
        warning={confirmCopy?.warning}
        confirmButtonText={confirmCopy?.button}
        confirmButtonVariant={confirmCopy?.variant}
        confirmButtonLoading={confirming}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
      />
    </HubManagementLayout>
  );
}
