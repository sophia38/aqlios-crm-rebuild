'use client';

import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Search from '@mui/icons-material/Search';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import type { PublicPractice } from '@/lib/api/types';

export interface OdsPracticeSearchProps {
  value: PublicPractice | null;
  onSelect: (practice: PublicPractice | null) => void;
  /** The typed text, kept by the form so "required" can be checked without a selection. */
  inputValue: string;
  onInputValueChange: (value: string) => void;
  onBlur?: () => void;
  error?: boolean;
  helperText?: React.ReactNode;
}

/** Type-ahead over the NHS ODS directory; picking one autofills the form (COMPONENTS.md → OdsPracticeSearch). */
export function OdsPracticeSearch({
  value,
  onSelect,
  inputValue: input,
  onInputValueChange: setInput,
  onBlur,
  error,
  helperText,
}: OdsPracticeSearchProps) {
  const [options, setOptions] = useState<PublicPractice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = input.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      practiceManagementApi
        .odsSearch(query, controller.signal)
        .then(setOptions)
        .catch(() => !controller.signal.aborted && setOptions([]))
        .finally(() => !controller.signal.aborted && setLoading(false));
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  return (
    <Autocomplete
      value={value}
      onChange={(_, next) => onSelect(next)}
      inputValue={input}
      onInputChange={(_, next) => setInput(next)}
      clearOnBlur={false}
      options={input.trim().length < 2 ? [] : options}
      loading={loading}
      filterOptions={(items) => items}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, selected) => option.ods_code === selected.ods_code}
      noOptionsText={input.trim().length < 2 ? 'Type at least 2 characters' : 'No practices found. Try another search.'}
      onBlur={onBlur}
      renderOption={({ key, ...props }, option) => (
        <Box component="li" key={key} {...props} sx={{ display: 'block !important' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{option.name}</Typography>
          <Typography variant="caption">
            {option.ods_code} | {option.pcn_code}
          </Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          name="ods_search"
          label="Practice name or ODS code"
          required
          placeholder="Search by practice name or ODS code"
          error={error}
          helperText={helperText}
          slotProps={{
            ...params.slotProps,
            inputLabel: { ...params.slotProps.inputLabel, shrink: true },
            input: {
              ...params.slotProps.input,
              startAdornment: <Search fontSize="small" sx={{ color: 'text.secondary', ml: 0.5 }} />,
            },
          }}
        />
      )}
    />
  );
}
