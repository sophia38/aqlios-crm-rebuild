'use client';

import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi } from '@/lib/api/practiceManagement';

export type PracticeOption = { id: string; practice_name: string };

/**
 * Practice filter: searched on the server, 20 at a time, instead of the live `page_size=1000` list
 * (REBUILD-PLAN.md §8). Used by Associated Users, ROTA and CQC Compliance.
 */
export function PracticeFilterSelect({
  value,
  onChange,
  label = 'Practice',
  allLabel = 'All',
}: {
  value: PracticeOption | null;
  onChange: (value: PracticeOption | null) => void;
  label?: string;
  allLabel?: string;
}) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<PracticeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      practiceManagementApi
        .practices(PUBLIC_SUB_APP_ID, { page_size: 20, search: input.trim() || undefined }, controller.signal)
        .then((result) => setOptions(result.results))
        .catch(() => undefined)
        .finally(() => !controller.signal.aborted && setLoading(false));
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  return (
    <Autocomplete
      size="small"
      options={options}
      value={value}
      loading={loading}
      onChange={(_, next) => onChange(next)}
      onInputChange={(_, next, reason) => reason === 'input' && setInput(next)}
      getOptionLabel={(option) => option.practice_name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={(items) => items}
      noOptionsText="No practices found"
      sx={{ minWidth: 220, flex: '0 1 280px' }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={allLabel}
          slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps.inputLabel, shrink: true } }}
          sx={{ '& .MuiInputBase-root': { fontSize: 13 } }}
        />
      )}
    />
  );
}
