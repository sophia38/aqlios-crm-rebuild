'use client';

import Button from '@mui/material/Button';
import ChevronLeft from '@mui/icons-material/ChevronLeft';

export interface GoBackLinkProps {
  onClick: () => void;
  children?: React.ReactNode;
  /** `text`: plain "‹ Go Back". `pill`: the practice pages' white "‹ Back" pill with a shadow. */
  variant?: 'text' | 'pill';
}

/** "‹ Go Back" button (COMPONENTS.md → GoBackLink). */
export function GoBackLink({ onClick, children = 'Go Back', variant = 'text' }: GoBackLinkProps) {
  if (variant === 'pill') {
    return (
      <Button
        variant="text"
        startIcon={<ChevronLeft />}
        onClick={onClick}
        sx={(theme) => ({
          px: 1.75,
          py: 0.5,
          alignSelf: 'flex-start',
          color: 'text.primary',
          fontWeight: 500,
          bgcolor: 'background.paper',
          borderRadius: `${theme.tokens.radius.pill}px`,
          boxShadow: theme.tokens.shadow.sm,
          '&:hover': { bgcolor: theme.tokens.neutral[50] },
        })}
      >
        {children}
      </Button>
    );
  }
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
