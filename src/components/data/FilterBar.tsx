'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';
import FilterList from '@mui/icons-material/FilterList';
import Refresh from '@mui/icons-material/Refresh';
import Search from '@mui/icons-material/Search';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  options: FilterOption[];
  /** Label of the empty value, e.g. "All Roles". */
  allLabel: string;
}

export interface FilterBarProps {
  filters: FilterDefinition[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  search?: { value: string; onChange: (value: string) => void; placeholder: string; label?: string };
  onClear: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Custom filter controls after the selects, e.g. a server-searched practice picker. */
  children?: React.ReactNode;
  /** Hide the "☰ Filters:" label (pages with only a search, e.g. the Roles List). */
  hideLabel?: boolean;
  /** Debounce for search, in ms (live CQC uses 400ms). */
  searchDebounceMs?: number;
}

/**
 * "☰ Filters:" card with small outlined selects, search with 🔍, Clear filters and optional
 * Refresh (COMPONENTS.md → FilterBar).
 */
export function FilterBar({
  filters,
  values,
  onChange,
  search,
  onClear,
  onRefresh,
  refreshing = false,
  hideLabel = false,
  children,
  searchDebounceMs = 400,
}: FilterBarProps) {
  const [draft, setDraft] = useState(search?.value ?? '');
  const [lastExternal, setLastExternal] = useState(search?.value ?? '');

  // Follow outside changes to the search value (e.g. Clear filters).
  if (search && search.value !== lastExternal) {
    setLastExternal(search.value);
    setDraft(search.value);
  }

  useEffect(() => {
    if (!search || draft === search.value) return;
    const timer = window.setTimeout(() => search.onChange(draft), searchDebounceMs);
    return () => window.clearTimeout(timer);
  }, [draft, search, searchDebounceMs]);

  const hasValues = Object.values(values).some(Boolean) || Boolean(search?.value);

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.card}px`,
        border: `1px solid ${theme.tokens.border.medium}`,
      })}
    >
      {!hideLabel && (
        <Typography
          component="span"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 14, fontWeight: 600 }}
        >
          <FilterList fontSize="small" aria-hidden />
          Filters:
        </Typography>
      )}
      {filters.map((filter) => (
        <TextField
          key={filter.id}
          select
          size="small"
          label={filter.label}
          value={values[filter.id] ?? ''}
          onChange={(event) => onChange(filter.id, event.target.value)}
          fullWidth={false}
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          sx={{ minWidth: 160, '& .MuiInputBase-root': { fontSize: 13 } }}
        >
          <MenuItem value="">{filter.allLabel}</MenuItem>
          {filter.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ))}
      {children}
      {search && (
        <TextField
          size="small"
          label={search.label}
          placeholder={search.placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          fullWidth={false}
          slotProps={{
            htmlInput: { 'aria-label': search.label ? undefined : search.placeholder },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ flex: '1 1 240px', minWidth: 200, '& .MuiInputBase-root': { fontSize: 13 } }}
        />
      )}
      <Button
        variant="text"
        size="small"
        startIcon={<Close />}
        onClick={onClear}
        disabled={!hasValues}
        sx={{ color: 'text.secondary' }}
      >
        Clear filters
      </Button>
      {onRefresh && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={onRefresh}
          disabled={refreshing}
          sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
        >
          Refresh
        </Button>
      )}
    </Box>
  );
}
