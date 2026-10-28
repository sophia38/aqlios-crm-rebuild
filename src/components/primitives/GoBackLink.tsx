'use client';

import Button from '@mui/material/Button';
import ChevronLeft from '@mui/icons-material/ChevronLeft';

/** "‹ Go Back" text button (COMPONENTS.md → GoBackLink). */
export function GoBackLink({ onClick, children = 'Go Back' }: { onClick: () => void; children?: React.ReactNode }) {
  return (
    <Button
      variant="text"
      startIcon={<ChevronLeft />}
      onClick={onClick}
      sx={{ px: 1, py: 0.5, color: 'text.primary', fontWeight: 500, alignSelf: 'flex-start' }}
    >
      {children}
    </Button>
  );
}
