'use client';

import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import type { RotaGroup } from '@/lib/api/types';

export interface RotaGroupSelectProps {
  subAppId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}

/** Multi-select of active rota groups shown as teal chips (COMPONENTS.md → RotaGroupSelect). */
export function RotaGroupSelect({ subAppId, value, onChange }: RotaGroupSelectProps) {
  const [groups, setGroups] = useState<RotaGroup[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    practiceManagementApi
      .rotaGroups(subAppId, controller.signal)
      .then(setGroups)
      .catch(() => !controller.signal.aborted && setGroups([]));
    return () => controller.abort();
  }, [subAppId]);

  const selected = (groups ?? []).filter((group) => value.includes(group.id));

  return (
    <Autocomplete
      multiple
      value={selected}
      onChange={(_, next) => onChange(next.map((group) => group.id))}
      options={groups ?? []}
      loading={groups === null}
      loadingText="Loading..."
      noOptionsText="No rota groups available."
      getOptionLabel={(group) => group.name}
      isOptionEqualToValue={(option, current) => option.id === current.id}
      renderValue={(items, getItemProps) =>
        items.map((group, index) => {
          const { key, ...props } = getItemProps({ index });
          return (
            <Chip
              key={key}
              {...props}
              label={group.name}
              size="small"
              sx={(theme) => ({ bgcolor: theme.tokens.surface.tealLight, color: 'primary.main' })}
            />
          );
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Rota Group(s)"
          slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps.inputLabel, shrink: true } }}
        />
      )}
    />
  );
}
