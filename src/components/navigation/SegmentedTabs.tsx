'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

export interface SegmentedTab<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedTabsProps<T extends string> {
  items: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  size?: 'small' | 'medium';
  /** `primary`: dark-teal active tab (ROTA, Staff, HR Policies). `brand`: cyan active tab (Templates, Tickets). */
  tone?: 'primary' | 'brand';
  fullWidth?: boolean;
}

/** White pill container with pill tabs; the active tab is filled (COMPONENTS.md → SegmentedTabs). */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  'aria-label': ariaLabel,
  size = 'medium',
  tone = 'primary',
  fullWidth = false,
}: SegmentedTabsProps<T>) {
  return (
    <Box
      role="tablist"
      aria-label={ariaLabel}
      sx={(theme) => ({
        display: fullWidth ? 'flex' : 'inline-flex',
        gap: 0.5,
        p: 0.5,
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.pill}px`,
        border: `1px solid ${theme.tokens.border.medium}`,
        maxWidth: '100%',
        overflowX: 'auto',
      })}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <ButtonBase
            key={item.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            sx={(theme) => {
              const activeBg = tone === 'brand' ? theme.palette.brand.main : theme.palette.primary.main;
              const activeText =
                tone === 'brand' ? theme.palette.brand.contrastText : theme.palette.primary.contrastText;
              return {
                flex: fullWidth ? 1 : undefined,
                gap: 1,
                px: size === 'small' ? 2 : 2.5,
                py: size === 'small' ? 0.75 : 1.1,
                borderRadius: `${theme.tokens.radius.pill}px`,
                fontSize: size === 'small' ? 13 : 14,
                fontWeight: selected ? 600 : 500,
                whiteSpace: 'nowrap',
                color: selected ? activeText : theme.palette.text.secondary,
                bgcolor: selected ? activeBg : 'transparent',
                transition: theme.transitions.create(['background-color', 'color']),
                '&:hover': { bgcolor: selected ? activeBg : theme.tokens.surface.tealLight },
                '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
                '& svg': { fontSize: 18 },
              };
            }}
          >
            {item.icon}
            {item.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
