'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { asset } from '@/lib/basePath';

export interface VerticalCardProps {
  label: string;
  onClick?: () => void;
  logoSrc?: string;
  disabled?: boolean;
}

/** Lightbulb card on /verticals; disabled cards are faded and not clickable (COMPONENTS.md → VerticalCard). */
export function VerticalCard({
  label,
  onClick,
  logoSrc = '/business_logos/business_svg.svg',
  disabled = false,
}: VerticalCardProps) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      focusRipple
      sx={(theme) => ({
        width: '100%',
        minHeight: 220,
        p: 3,
        flexDirection: 'column',
        gap: 2,
        borderRadius: '16px',
        border: `1px solid ${theme.tokens.border.medium}`,
        background: `linear-gradient(180deg, ${theme.tokens.surface.background} 0%, ${theme.tokens.surface.mintWash} 100%)`,
        transition: theme.transitions.create(['box-shadow', 'border-color', 'transform']),
        '&:hover': { boxShadow: theme.tokens.shadow.card, borderColor: theme.palette.brand.main },
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
        '&.Mui-disabled': { opacity: 0.45, filter: 'grayscale(1)' },
      })}
    >
      <Box component="img" src={asset(logoSrc)} alt="" sx={{ width: 86, height: 100 }} />
      <Typography
        component="span"
        sx={{ fontSize: 20, fontWeight: 600, lineHeight: 1.35, color: 'text.primary', maxWidth: 180 }}
      >
        {label}
      </Typography>
    </ButtonBase>
  );
}
