'use client';

import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import type { Theme } from '@mui/material/styles';
import NorthEast from '@mui/icons-material/NorthEast';
import { StatusChip } from '@/components/data/StatusChip';
import type { PracticeStage } from '@/lib/api/types';

export const STAGE_LABELS: Record<PracticeStage, string> = {
  LIVE: 'Live',
  ONBOARDING: 'Onboarding',
  REVIEW: 'Review',
};

export interface PracticeCardProps {
  name: string;
  odsCode: string;
  city: string;
  stage: PracticeStage;
  staffCount: number;
  rotaCount: number;
  /** 0–100, or null when the practice has no rota this week. */
  coverage: number | null;
  onSelect: () => void;
}

const barColor = (theme: Theme, stage: PracticeStage) =>
  stage === 'REVIEW'
    ? theme.tokens.tone.error.main
    : stage === 'ONBOARDING'
      ? theme.palette.primary.dark
      : theme.palette.primary.main;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * Practices grid card (Figma "Public GP Flows" 9107:73594, COMPONENTS.md → PracticeCard): name and
 * stage chip, ODS code and town, then staff and rota counts with this week's rota coverage bar and ↗.
 * The whole card opens the practice.
 */
export function PracticeCard({
  name,
  odsCode,
  city,
  stage,
  staffCount,
  rotaCount,
  coverage,
  onSelect,
}: PracticeCardProps) {
  return (
    <ButtonBase
      onClick={onSelect}
      aria-label={`Open practice ${name}`}
      sx={(theme) => ({
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        textAlign: 'left',
        // Narrow cards drop the "Rota coverage" words and keep the bar and %.
        containerType: 'inline-size',
        borderRadius: `${theme.tokens.radius.tile}px`,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.tokens.shell.panelBorder}`,
        transition: theme.transitions.create(['box-shadow', 'border-color']),
        '&:hover': { borderColor: theme.tokens.shell.vertical.hoverBorder, boxShadow: theme.tokens.shadow.sm },
        '&:hover .practice-card-arrow': {
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
        },
        '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 2, pt: 1.75, pb: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            noWrap
            title={name}
            sx={(theme) => ({ fontSize: 15, fontWeight: 600, color: theme.tokens.shell.ink })}
          >
            {name}
          </Typography>
          <Typography noWrap sx={(theme) => ({ mt: 0.25, fontSize: 12, color: theme.tokens.shell.inkMuted })}>
            {[odsCode && `ODS ${odsCode}`, city].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
        <StatusChip status={STAGE_LABELS[stage]} dot />
      </Box>
      <Box
        sx={(theme) => ({
          mt: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 2,
          py: 1.25,
          borderTop: `1px solid ${theme.tokens.shell.menu.divider}`,
          fontSize: 12.5,
          color: theme.tokens.shell.inkMuted,
          whiteSpace: 'nowrap',
        })}
      >
        <Box component="span" sx={(theme) => ({ mr: 'auto', color: theme.tokens.shell.ink })}>
          {staffCount} staff · {plural(rotaCount, 'rota')}
        </Box>
        {coverage === null ? (
          <Box component="span" sx={{ flex: 1, textAlign: 'right' }}>
            No rota this week
          </Box>
        ) : (
          <>
            <Box component="span" sx={{ ml: 'auto', '@container (max-width: 300px)': { display: 'none' } }}>
              Rota coverage
            </Box>
            <Box
              aria-hidden
              sx={(theme) => ({
                flex: 1,
                minWidth: 32,
                maxWidth: 80,
                height: 5,
                borderRadius: `${theme.tokens.radius.pill}px`,
                bgcolor: theme.tokens.shell.line,
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  display: 'block',
                  height: '100%',
                  width: `${coverage}%`,
                  borderRadius: 'inherit',
                  bgcolor: barColor(theme, stage),
                },
              })}
            />
            <Box component="span" sx={(theme) => ({ fontWeight: 600, color: theme.tokens.shell.ink })}>
              {coverage}%
            </Box>
          </>
        )}
        <Box
          className="practice-card-arrow"
          aria-hidden
          sx={(theme) => ({
            width: 26,
            height: 26,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: theme.tokens.shell.well,
            color: theme.tokens.shell.ink,
            transition: theme.transitions.create(['background-color', 'color']),
          })}
        >
          <NorthEast sx={{ fontSize: 14 }} />
        </Box>
      </Box>
    </ButtonBase>
  );
}
