'use client';

import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import type { PracticeManager } from '@/lib/api/types';

export interface PracticeManagerSelectProps {
  /** Selected manager id, or null. */
  value: string | null;
  /** Name shown before the options load (from the practice record). */
  initialLabel?: string;
  onChange: (managerId: string | null) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Autocomplete of practice managers, two lines (name, email), 10 per page with "Load more" via
 * scrolling to the end of the list (COMPONENTS.md → PracticeManagerSelect).
 */
export function PracticeManagerSelect({
  value,
  initialLabel,
  onChange,
  label = 'Practice Manager',
  disabled,
}: PracticeManagerSelectProps) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<PracticeManager[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // New search: restart from page 1 (the page reset happens in onInputChange).
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      practiceManagementApi
        .practiceManagers(PUBLIC_SUB_APP_ID, { page, search: input.trim() || undefined }, controller.signal)
        .then((result) => {
          setOptions((current) => (page === 1 ? result.results : [...current, ...result.results]));
          setHasMore(Boolean(result.next));
        })
        .catch(() => undefined)
        .finally(() => !controller.signal.aborted && setLoading(false));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input, page]);

  const selected =
    options.find((option) => option.id === value) ??
    (value ? { id: value, full_name: initialLabel ?? '', email: '' } : null);

  return (
    <Autocomplete
      value={selected}
      onChange={(_, next) => onChange(next?.id ?? null)}
      inputValue={input}
      onInputChange={(_, next, reason) => {
        if (reason === 'input' || reason === 'clear') {
          setInput(reason === 'clear' ? '' : next);
          setPage(1);
        }
      }}
      options={options}
      loading={loading}
      disabled={disabled}
      filterOptions={(items) => items}
      getOptionLabel={(option) => option.full_name}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      noOptionsText="No managers found"
      slotProps={{
        listbox: {
          onScroll: (event: React.UIEvent<HTMLElement>) => {
            const list = event.currentTarget;
            if (hasMore && !loading && list.scrollTop + list.clientHeight >= list.scrollHeight - 24) {
              setPage((current) => current + 1);
            }
          },
        },
      }}
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={key} {...props} sx={{ display: 'block !important' }}>
          <Typography sx={{ fontSize: 14 }}>{option.full_name}</Typography>
          <Typography variant="caption">{option.email}</Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          name="practice_manager"
          label={label}
          placeholder="Select practice manager"
          slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps.inputLabel, shrink: true } }}
        />
      )}
    />
  );
}
