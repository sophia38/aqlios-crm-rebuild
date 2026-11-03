'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';
import Search from '@mui/icons-material/Search';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { TemplateCard } from '@/features/templates/components/TemplateCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { templatesApi, templateText } from '@/lib/api/templates';
import { TEMPLATE_CATEGORIES, type CommunicationTemplate, type TemplateCategory } from '@/lib/api/types';

type Scope = 'standard' | 'staff';
type TypeFilter = '' | 'EMAIL' | 'MESSAGE';

/** Fills the `{{placeholders}}` we know; unknown ones stay as they are for the user to edit. */
export function fillPlaceholders(text: string, values: Record<string, string>) {
  return text.replace(/\{\{([a-z_]+)\}\}/g, (match, key: string) => values[key] || match);
}

/**
 * Browse Templates (captured 2026-11-03): a 1200px dialog with Standard / Staff Created tabs, a
 * category rail, Search and Type filters, and cards with Use Template. Only active templates are
 * listed. `kind="note"` lists Note templates for Clinical Notes.
 */
export function TemplatePickerDialog({
  open,
  kind,
  placeholders,
  onClose,
  onUse,
}: {
  open: boolean;
  kind: 'message' | 'note';
  placeholders: Record<string, string>;
  onClose: () => void;
  /** Receives the template text with the placeholders filled in. */
  onUse: (text: string, template: CommunicationTemplate) => void;
}) {
  const titleId = useId();
  const { enqueueSnackbar } = useSnackbar();
  const [scope, setScope] = useState<Scope>('standard');
  const [templates, setTemplates] = useState<Record<Scope, CommunicationTemplate[] | null>>({
    standard: null,
    staff: null,
  });
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('');
  const [category, setCategory] = useState<TemplateCategory | ''>('');

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    for (const item of ['standard', 'staff'] as const) {
      templatesApi
        .list(PUBLIC_SUB_APP_ID, { scope: item, status: 'ACTIVE' }, controller.signal)
        .then((response) => setTemplates((current) => ({ ...current, [item]: response.results })))
        .catch(() => {
          if (controller.signal.aborted) return;
          setTemplates((current) => ({ ...current, [item]: [] }));
          enqueueSnackbar('Failed to load templates', { variant: 'error' });
        });
    }
    return () => controller.abort();
  }, [open, enqueueSnackbar]);

  const ofKind = (items: CommunicationTemplate[] | null) =>
    (items ?? []).filter((template) => (kind === 'note' ? template.type === 'NOTE' : template.type !== 'NOTE'));
  const counts = { standard: ofKind(templates.standard).length, staff: ofKind(templates.staff).length };
  const loading = templates[scope] === null;

  const matching = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (templates[scope] ?? [])
      .filter((template) => (kind === 'note' ? template.type === 'NOTE' : template.type !== 'NOTE'))
      .filter((template) => !type || template.type === type)
      .filter(
        (template) =>
          !term ||
          template.name.toLowerCase().includes(term) ||
          templateText(template.body).toLowerCase().includes(term),
      );
  }, [templates, scope, kind, type, search]);

  // The rail counts follow the search and type filters, and "All Templates" is their sum (fixes live 13 vs 14).
  const categories = TEMPLATE_CATEGORIES.map((name) => ({
    name,
    count: matching.filter((template) => template.category === name).length,
  })).filter((item) => item.count > 0);
  const shown = matching.filter((template) => !category || template.category === category);
  const filtersSet = Boolean(search || type || category);
  const label = kind === 'note' ? 'Note Templates' : 'Message Templates';

  const reset = () => {
    setSearch('');
    setType('');
    setCategory('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: (theme) => ({
            width: 1200,
            maxWidth: 'calc(100% - 32px)',
            height: 640,
            maxHeight: 'calc(100% - 32px)',
            m: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: `${theme.tokens.radius.base}px`,
            border: 'none',
          }),
        },
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 1.5 }}>
        <Typography id={titleId} component="h2" sx={{ fontSize: 20, fontWeight: 600 }}>
          {label} ({counts.standard + counts.staff})
        </Typography>
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </Stack>
      <Box sx={{ px: 3, pb: 2 }}>
        <SegmentedTabs<Scope>
          aria-label="Template source"
          tone="brand"
          size="small"
          value={scope}
          onChange={(next) => {
            setScope(next);
            setCategory('');
          }}
          items={[
            { value: 'standard', label: `Standard Templates (${counts.standard})` },
            { value: 'staff', label: `Staff Created (${counts.staff})` },
          ]}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          overflowY: { xs: 'auto', md: 'hidden' },
        }}
      >
        <Box
          component="nav"
          aria-label="Template categories"
          sx={(theme) => ({
            width: { md: 240 },
            flexShrink: 0,
            px: { xs: 3, md: 2 },
            py: { xs: 1, md: 2 },
            borderRight: { md: `1px solid ${theme.tokens.border.medium}` },
            overflowY: { md: 'auto' },
          })}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1, display: { xs: 'none', md: 'block' } }}>
            Template Categories
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: 'none',
              m: 0,
              p: 0,
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              gap: 0.5,
            }}
          >
            {[{ name: '' as const, count: matching.length }, ...categories].map((item) => {
              const selected = category === item.name;
              return (
                <li key={item.name || 'all'}>
                  <ButtonBase
                    aria-pressed={selected}
                    onClick={() => setCategory(item.name)}
                    sx={(theme) => ({
                      width: { md: '100%' },
                      justifyContent: 'space-between',
                      gap: 1.5,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: `${theme.tokens.radius.input}px`,
                      fontSize: 13,
                      fontWeight: selected ? 600 : 400,
                      color: selected ? theme.palette.brand.contrastText : theme.palette.text.primary,
                      bgcolor: selected ? theme.palette.brand.soft : 'transparent',
                      '&:hover': { bgcolor: theme.tokens.surface.tealLight },
                      '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}` },
                    })}
                  >
                    <span>{item.name || 'All Templates'}</span>
                    <span>{item.count}</span>
                  </ButtonBase>
                </li>
              );
            })}
          </Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, px: 3, py: 2, overflowY: { md: 'auto' } }}>
          <Typography component="h3" sx={{ fontSize: 16, fontWeight: 600 }}>
            {scope === 'standard' ? 'Standard Templates' : 'Staff Created'} ({counts[scope]})
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {scope === 'standard'
              ? 'Templates created or approved by administrators.'
              : 'Templates created by practice staff.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
            <TextField
              size="small"
              label="Search"
              placeholder="Search Templates"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flex: 1 }}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            {kind === 'message' && (
              <TextField
                select
                size="small"
                label="Type"
                value={type}
                onChange={(event) => setType(event.target.value as TypeFilter)}
                sx={{ minWidth: 150 }}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="EMAIL">Email</MenuItem>
                <MenuItem value="MESSAGE">Message</MenuItem>
              </TextField>
            )}
            <Button variant="outlined" onClick={reset} disabled={!filtersSet} sx={{ flexShrink: 0 }}>
              Clear Filters
            </Button>
          </Stack>
          {loading ? (
            <Box role="status" aria-label="Loading templates" sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : shown.length === 0 ? (
            <Typography variant="body2" sx={{ textAlign: 'center', py: 6 }}>
              {filtersSet ? 'No templates found. Try another search.' : 'No templates yet.'}
            </Typography>
          ) : (
            <Stack spacing={3}>
              {TEMPLATE_CATEGORIES.map((name) => {
                const group = shown.filter((template) => template.category === name);
                if (!group.length) return null;
                return (
                  <Box key={name} component="section" aria-label={name}>
                    <Typography component="h4" sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
                      {name} ({group.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {group.map((template) => (
                        <Grid key={template.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                          <TemplateCard
                            template={template}
                            action={
                              <Button
                                size="small"
                                variant="contained"
                                color="brand"
                                aria-label={`Use template ${template.name}`}
                                onClick={() => {
                                  onUse(fillPlaceholders(templateText(template.body), placeholders), template);
                                  reset();
                                }}
                              >
                                Use Template
                              </Button>
                            }
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
