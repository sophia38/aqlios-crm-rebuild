'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface StatItem {
  label: string;
  value: number;
  color: string;
  /** Small line under the label (CQC cards). */
  caption?: string;
}

/**
 * KPI numbers with a coloured left bar (COMPONENTS.md → StatsStrip). `strip`: one grey panel
 * (Activity Tracker). `cards`: separate white cards in a grid (CQC Compliance).
 */
export function StatsStrip({ items, variant = 'strip' }: { items: StatItem[]; variant?: 'strip' | 'cards' }) {
  const cards = variant === 'cards';
  return (
    <Box
      component="ul"
      sx={(theme) => ({
        listStyle: 'none',
        m: 0,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: cards
          ? { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }
          : { xs: '1fr', sm: `repeat(${items.length}, 1fr)` },
        p: cards ? 0 : 2,
        bgcolor: cards ? 'transparent' : theme.tokens.rota.activity.stripBg,
        borderRadius: `${theme.tokens.radius.input}px`,
      })}
    >
      {items.map((item) => (
        <Box
          component="li"
          key={item.label}
          sx={(theme) => ({
            display: 'flex',
            gap: 1.5,
            p: cards ? 2 : 0.5,
            bgcolor: cards ? 'background.paper' : 'transparent',
            border: cards ? `1px solid ${theme.tokens.border.medium}` : 'none',
            borderRadius: `${theme.tokens.radius.input}px`,
          })}
        >
          <Box
            aria-hidden
            sx={(theme) => ({
              width: 4,
              borderRadius: `${theme.tokens.radius.pill}px`,
              bgcolor: item.color,
              flexShrink: 0,
            })}
          />
          <Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.label}</Typography>
            <Typography sx={{ fontSize: 34, fontWeight: 600, lineHeight: 1.2, color: 'text.primary' }}>
              {String(item.value).padStart(2, '0')}
            </Typography>
            {item.caption && <Typography variant="caption">{item.caption}</Typography>}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
