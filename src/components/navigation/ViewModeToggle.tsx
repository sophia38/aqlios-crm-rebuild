'use client';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import GridViewRounded from '@mui/icons-material/GridViewRounded';
import ViewListRounded from '@mui/icons-material/ViewListRounded';

export type ViewMode = 'list' | 'grid';

/** List/Grid icon toggle; the active one is a teal filled circle (COMPONENTS.md → ViewModeToggle). */
export function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  const options: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'list', label: 'List view', icon: <ViewListRounded fontSize="small" /> },
    { mode: 'grid', label: 'Grid view', icon: <GridViewRounded fontSize="small" /> },
  ];
  return (
    <Box
      role="tablist"
      aria-label="View as list or grid"
      sx={(theme) => ({
        display: 'inline-flex',
        gap: 0.5,
        p: 0.5,
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.pill}px`,
        boxShadow: theme.tokens.shadow.sm,
      })}
    >
      {options.map(({ mode, label, icon }) => {
        const selected = mode === value;
        return (
          <IconButton
            key={mode}
            role="tab"
            aria-selected={selected}
            aria-label={label}
            onClick={() => onChange(mode)}
            size="small"
            sx={(theme) => ({
              width: 36,
              height: 36,
              color: selected ? 'primary.contrastText' : 'text.secondary',
              bgcolor: selected ? 'primary.main' : 'transparent',
              '&:hover': { bgcolor: selected ? 'primary.dark' : theme.tokens.surface.tealLight },
            })}
          >
            {icon}
          </IconButton>
        );
      })}
    </Box>
  );
}
