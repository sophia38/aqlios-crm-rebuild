'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import NorthEast from '@mui/icons-material/NorthEast';
import { EntityAvatar } from '@/components/primitives/EntityAvatar';

export interface HubCardProps {
  name: string;
  logoSrc?: string | null;
  onSelect: () => void;
  disabled?: boolean;
}

/**
 * Practice grid card: grey inner pill (logo or initials | divider | name, max 2 lines) and a round
 * ↗ "Open business" button (COMPONENTS.md → HubCard). The whole card is the button.
 */
export function HubCard({ name, logoSrc, onSelect, disabled }: HubCardProps) {
  return (
    <ButtonBase
      onClick={onSelect}
      disabled={disabled}
      aria-label={`Open business ${name}`}
      sx={(theme) => ({
        width: '100%',
        justifyContent: 'space-between',
        gap: 1.5,
        p: 1.5,
        borderRadius: `${theme.tokens.radius.card}px`,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.tokens.border.medium}`,
        transition: theme.transitions.create(['box-shadow', 'border-color']),
        '&:hover': { boxShadow: theme.tokens.shadow.card },
        '&:hover .hub-card-pill': { bgcolor: theme.tokens.surface.tealLight },
        '&:hover .hub-card-arrow': { bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText },
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      })}
    >
      <Box
        className="hub-card-pill"
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.25,
          py: 1,
          borderRadius: `${theme.tokens.radius.pill}px`,
          bgcolor: theme.tokens.neutral[100],
          transition: theme.transitions.create('background-color'),
        })}
      >
        <EntityAvatar name={name} logoSrc={logoSrc} size={40} />
        <Divider orientation="vertical" flexItem />
        <Tooltip title={name} placement="top" enterDelay={400}>
          <Typography
            sx={{
              flex: 1,
              fontSize: 14,
              fontWeight: 500,
              color: 'text.primary',
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {name}
          </Typography>
        </Tooltip>
      </Box>
      <Box
        className="hub-card-arrow"
        aria-hidden
        sx={(theme) => ({
          width: 40,
          height: 40,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '50%',
          border: `2px solid ${theme.tokens.text.iconDark}`,
          color: theme.tokens.text.iconDark,
          transition: theme.transitions.create(['background-color', 'color']),
        })}
      >
        <NorthEast fontSize="small" />
      </Box>
    </ButtonBase>
  );
}
