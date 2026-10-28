'use client';

import { useId, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircle from '@mui/icons-material/CheckCircle';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ExpandMore from '@mui/icons-material/ExpandMore';
import type { Permission } from '@/lib/api/types';

export interface PermissionTreeProps {
  catalog: Permission[];
  selected: string[];
  onChange?: (ids: string[]) => void;
  mode: 'view' | 'edit';
  /** Filters rows by their description; modules with a match open automatically. */
  search?: string;
}

interface Row {
  permission: Permission;
  depth: number;
}

interface Module {
  name: string;
  rows: Row[];
}

/** Groups the catalog by module, keeping its order, and works out each permission's indent. */
function buildModules(catalog: Permission[]): Module[] {
  const byId = new Map(catalog.map((permission) => [permission.id, permission]));
  const depthOf = (permission: Permission): number =>
    permission.parent && byId.has(permission.parent) ? depthOf(byId.get(permission.parent)!) + 1 : 0;
  const modules = new Map<string, Module>();
  for (const permission of catalog) {
    const group = modules.get(permission.module) ?? { name: permission.module, rows: [] };
    group.rows.push({ permission, depth: depthOf(permission) });
    modules.set(permission.module, group);
  }
  return [...modules.values()];
}

/**
 * Permission accordion per module (COMPONENTS.md → PermissionTree, docs/super-admin/05-roles-and-permissions.md §3).
 * Ticking a child also ticks its parents; unticking a parent unticks its children.
 */
export function PermissionTree({ catalog, selected, onChange, mode, search = '' }: PermissionTreeProps) {
  const modules = useMemo(() => buildModules(catalog), [catalog]);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const term = search.trim().toLowerCase();
  const editing = mode === 'edit';

  const ancestors = (id: string) => {
    const result: string[] = [];
    let parent = catalog.find((permission) => permission.id === id)?.parent;
    while (parent) {
      result.push(parent);
      parent = catalog.find((permission) => permission.id === parent)?.parent;
    }
    return result;
  };
  const descendants = (id: string): string[] =>
    catalog.filter((permission) => permission.parent === id).flatMap((child) => [child.id, ...descendants(child.id)]);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(selectedSet);
    if (checked) [id, ...ancestors(id)].forEach((item) => next.add(item));
    else [id, ...descendants(id)].forEach((item) => next.delete(item));
    onChange?.([...next]);
  };

  const toggleModule = (module: Module, checked: boolean) => {
    const next = new Set(selectedSet);
    module.rows.forEach(({ permission }) => (checked ? next.add(permission.id) : next.delete(permission.id)));
    onChange?.([...next]);
  };

  const visible = modules
    .map((module) => ({
      module,
      rows: term ? module.rows.filter((row) => row.permission.description.toLowerCase().includes(term)) : module.rows,
    }))
    .filter(({ rows }) => rows.length > 0);

  if (visible.length === 0) {
    return (
      <Typography variant="body2" sx={{ textAlign: 'center', py: 4 }}>
        No results matching &quot;{search.trim()}&quot;
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {visible.map(({ module, rows }) => (
        <ModuleSection
          key={module.name}
          module={module}
          rows={rows}
          expanded={Boolean(term) || open.has(module.name)}
          onToggleExpanded={() =>
            setOpen((current) => {
              const next = new Set(current);
              if (next.has(module.name)) next.delete(module.name);
              else next.add(module.name);
              return next;
            })
          }
          selected={selectedSet}
          editing={editing}
          onToggle={toggle}
          onToggleModule={(checked) => toggleModule(module, checked)}
          showSelectAll={editing && !term}
        />
      ))}
    </Stack>
  );
}

function ModuleSection({
  module,
  rows,
  expanded,
  onToggleExpanded,
  selected,
  editing,
  onToggle,
  onToggleModule,
  showSelectAll,
}: {
  module: Module;
  rows: Row[];
  expanded: boolean;
  onToggleExpanded: () => void;
  selected: Set<string>;
  editing: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onToggleModule: (checked: boolean) => void;
  showSelectAll: boolean;
}) {
  const contentId = useId();
  const total = module.rows.length;
  const count = module.rows.filter(({ permission }) => selected.has(permission.id)).length;

  return (
    <Box
      sx={(theme) => ({
        borderRadius: `${theme.tokens.radius.input}px`,
        bgcolor: theme.tokens.neutral[100],
        overflow: 'hidden',
      })}
    >
      <ButtonBase
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-controls={contentId}
        sx={{ width: '100%', justifyContent: 'flex-start', gap: 1, px: 1.5, py: 1.25, textAlign: 'left' }}
      >
        <ChevronRight
          aria-hidden
          sx={(theme) => ({
            fontSize: 20,
            color: 'text.secondary',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: theme.transitions.create('transform'),
          })}
        />
        <Typography component="span" sx={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
          {module.name}
        </Typography>
        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: 12,
            whiteSpace: 'nowrap',
            color: count > 0 ? theme.palette.success.main : 'text.secondary',
          })}
        >
          {count} / {total} permissions selected
        </Typography>
        <ExpandMore
          aria-hidden
          sx={(theme) => ({
            fontSize: 20,
            color: 'text.secondary',
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: theme.transitions.create('transform'),
          })}
        />
      </ButtonBase>
      <Collapse in={expanded} id={contentId} unmountOnExit>
        <Box
          sx={(theme) => ({
            bgcolor: 'background.paper',
            mx: 0.5,
            mb: 0.5,
            borderRadius: `${theme.tokens.radius.pickerItem}px`,
            py: 0.5,
          })}
        >
          {rows.map(({ permission, depth }) => {
            const checked = selected.has(permission.id);
            return (
              <Stack
                key={permission.id}
                direction="row"
                sx={{ alignItems: 'center', pl: 1 + depth * 3, pr: 1.5, minHeight: 40 }}
              >
                <FormControlLabel
                  sx={{ flex: 1, mr: 1, '& .MuiFormControlLabel-label': { fontSize: 14 } }}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      disabled={!editing}
                      onChange={(event) => onToggle(permission.id, event.target.checked)}
                    />
                  }
                  label={permission.description}
                />
                {!editing &&
                  (checked ? (
                    <CheckCircle
                      aria-label="Granted"
                      sx={(theme) => ({ fontSize: 18, color: theme.palette.success.main })}
                    />
                  ) : (
                    <CancelOutlined
                      aria-label="Not granted"
                      sx={(theme) => ({ fontSize: 18, color: theme.palette.error.main })}
                    />
                  ))}
              </Stack>
            );
          })}
          {showSelectAll && (
            <Box sx={(theme) => ({ borderTop: `1px solid ${theme.tokens.border.medium}`, mt: 0.5, pt: 0.5, px: 1 })}>
              <FormControlLabel
                sx={{ '& .MuiFormControlLabel-label': { fontSize: 14, fontWeight: 500 } }}
                control={
                  <Checkbox
                    size="small"
                    checked={count === total}
                    indeterminate={count > 0 && count < total}
                    onChange={(event) => onToggleModule(event.target.checked)}
                  />
                }
                label={`Select all ${total} permissions`}
              />
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
