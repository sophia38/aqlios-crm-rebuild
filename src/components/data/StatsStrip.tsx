'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface StatItem {
  label: string;
  value: number;
  color: string;
  /** Small line under the label (CQC cards). */
  caption?: string;
  /** `pill` only: the icon in the white circle. */
  icon?: React.ReactNode;
  /** `pill` only: the card's tinted background. */
  tint?: string;
}

/**
 * KPI numbers (COMPONENTS.md → StatsStrip). `strip`: one grey panel with coloured bars (Activity
 * Tracker). `cards`: separate white cards in a grid (CQC Compliance). `pill`: tinted rounded cards with
 * an icon circle, label and the big number on the right (Appointment, Staff and Leave).
 */
export function StatsStrip({ items, variant = 'strip' }: { items: StatItem[]; variant?: 'strip' | 'cards' | 'pill' }) {
  if (variant === 'pill') {
    return (
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gap: 2,
          // Up to 3 a row on laptops (5 cards don't fit beside each other at 1280px), all in one row on wide screens.
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: `repeat(${Math.min(items.length, 3)}, 1fr)`,
            xl: `repeat(${items.length}, 1fr)`,
          },
        }}
      >
        {items.map((item) => (
          <Box
            component="li"
            key={item.label}
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              bgcolor: item.tint ?? 'background.paper',
              borderRadius: `${theme.tokens.radius.base}px`,
            })}
          >
            {item.icon && (
              <Box
                aria-hidden
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  bgcolor: 'background.paper',
                  color: item.color,
                  '& svg': { fontSize: 22 },
                }}
              >
                {item.icon}
              </Box>
            )}
            <Typography sx={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
              {item.label}
            </Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 600, lineHeight: 1.2, color: item.color }}>
              {String(item.value).padStart(2, '0')}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

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
