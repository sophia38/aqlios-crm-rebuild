'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Search from '@mui/icons-material/Search';

export interface PracticeListToolbarProps {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchFieldLabel?: string;
  /** Debounce before searching, in ms. */
  debounceMs?: number;
}

/** "Practices List" heading and the full-width Practice Name search (COMPONENTS.md → PracticeListToolbar). */
export function PracticeListToolbar({
  title,
  search,
  onSearchChange,
  searchFieldLabel = 'Practice Name',
  debounceMs = 400,
}: PracticeListToolbarProps) {
  const [draft, setDraft] = useState(search);

  useEffect(() => {
    if (draft === search) return;
    const timer = window.setTimeout(() => onSearchChange(draft), debounceMs);
    return () => window.clearTimeout(timer);
  }, [debounceMs, draft, onSearchChange, search]);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700, mb: 1.5 }}>
        {title}
      </Typography>
      <TextField
        label={searchFieldLabel}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        type="search"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
      />
    </Box>
  );
}
