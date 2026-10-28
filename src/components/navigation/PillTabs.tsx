'use client';

import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export interface PillTab<T extends string> {
  value: T;
  label: string;
}

export interface PillTabsProps<T extends string> {
  tabs: PillTab<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
}

/** Row of separate pill buttons: active is teal filled, the others outlined (COMPONENTS.md → PillTabs). */
export function PillTabs<T extends string>({ tabs, value, onChange, 'aria-label': ariaLabel }: PillTabsProps<T>) {
  return (
    <Stack direction="row" spacing={1} role="tablist" aria-label={ariaLabel} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <Button
            key={tab.value}
            role="tab"
            aria-selected={selected}
            variant={selected ? 'contained' : 'outlined'}
            onClick={() => onChange(tab.value)}
            sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, py: 0.75, px: 2.5 })}
          >
            {tab.label}
          </Button>
        );
      })}
    </Stack>
  );
}
