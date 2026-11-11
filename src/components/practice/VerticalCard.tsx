'use client';

import type { SvgIconComponent } from '@mui/icons-material';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

export type VerticalTone = 'public' | 'private' | 'everyclinic';

export interface VerticalCardProps {
  label: string;
  description: string;
  icon: SvgIconComponent;
  tone: VerticalTone;
  onClick?: () => void;
  /** Not available: a pale card with a "Coming soon" tag, not clickable. */
  disabled?: boolean;
}

/** Vertical card on /verticals, refined design: icon tile, name and description (COMPONENTS.md → VerticalCard). */
export function VerticalCard({ label, description, icon: Icon, tone, onClick, disabled = false }: VerticalCardProps) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      focusRipple
      sx={(theme) => ({
        position: 'relative',
        width: '100%',
        minHeight: { xs: 0, sm: 150 },
        p: 2.25,
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: 0.5,
        textAlign: 'left',
        borderRadius: `${theme.tokens.radius.tile}px`,
        border: `1px solid ${theme.tokens.shell.line}`,
        bgcolor: disabled ? theme.tokens.shell.vertical.soonBg : 'background.paper',
        color: theme.tokens.shell.ink,
        transition: theme.transitions.create('border-color'),
        '&:hover, &.Mui-focusVisible': { borderColor: theme.tokens.shell.vertical.hoverBorder },
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        '&.Mui-disabled': { color: theme.tokens.shell.ink },
      })}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 38,
          height: 38,
          mb: { xs: 1, sm: 1.75 },
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: theme.tokens.shell.vertical[tone].bg,
          color: theme.tokens.shell.vertical[tone].fg,
        })}
      >
        <Icon sx={{ fontSize: 19 }} />
      </Box>
      <Typography component="span" sx={{ mt: 'auto', fontSize: 15.5, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography
        component="span"
        sx={(theme) => ({ fontSize: 13, lineHeight: 1.45, color: theme.tokens.shell.inkMuted })}
      >
        {description}
      </Typography>
      {disabled && (
        <Box
          component="span"
          sx={(theme) => ({
            position: 'absolute',
            top: 16,
            right: 16,
            px: 1,
            py: 0.25,
            fontSize: 11.5,
            borderRadius: `${theme.tokens.radius.pill}px`,
            bgcolor: theme.tokens.shell.well,
            color: theme.tokens.shell.inkMuted,
          })}
        >
          Coming soon
        </Box>
      )}
    </ButtonBase>
  );
}
