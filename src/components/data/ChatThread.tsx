'use client';

import { useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface ChatThreadEntry {
  id: string;
  /** `start`: the other party (AI Assistant, patient replies) on the left. `end`: our side on the right. */
  side: 'start' | 'end';
  author: string;
  text: string;
  /** Shown after the author, e.g. "27/10/2026 14:05". */
  time?: string;
  /** Small icon before the author, e.g. the robot for AI Assistant. */
  icon?: React.ReactNode;
  /** Extra line under the bubble, e.g. "Sent via Aqlios App". */
  meta?: string;
}

export interface ChatThreadProps {
  entries: ChatThreadEntry[];
  'aria-label': string;
  emptyText: string;
  /** Scrolls inside this height; omit to let the thread grow (expanded dialogs). */
  maxHeight?: number;
}

/**
 * Chat bubbles in a scrolling area (COMPONENTS.md → ChatThread): left bubbles are light grey with a
 * cyan left border, right bubbles cyan filled, as in the captured transcript. Scrolls to the newest.
 */
export function ChatThread({ entries, 'aria-label': ariaLabel, emptyText, maxHeight }: ChatThreadProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const last = entries.at(-1)?.id;

  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [last]);

  return (
    <Box
      ref={scroller}
      role="log"
      aria-label={ariaLabel}
      tabIndex={maxHeight ? 0 : undefined}
      sx={(theme) => ({
        maxHeight,
        overflowY: maxHeight ? 'auto' : 'visible',
        borderRadius: `${theme.tokens.radius.input}px`,
        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      })}
    >
      {entries.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 3 }}>
          {emptyText}
        </Typography>
      ) : (
        <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0.5 }}>
          {entries.map((entry) => {
            const end = entry.side === 'end';
            return (
              <Box
                key={entry.id}
                component="li"
                sx={{ display: 'flex', flexDirection: 'column', alignItems: end ? 'flex-end' : 'flex-start' }}
              >
                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: 'center', mb: 0.5, color: 'text.secondary', '& svg': { fontSize: 16 } }}
                >
                  {entry.icon}
                  <Typography component="span" sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary' }}>
                    {entry.author}
                  </Typography>
                  {entry.time && <Typography variant="caption">{entry.time}</Typography>}
                </Stack>
                <Box
                  sx={(theme) => ({
                    maxWidth: '85%',
                    px: 1.75,
                    py: 1.25,
                    fontSize: 14,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    borderRadius: `${theme.tokens.radius.input}px`,
                    ...(end
                      ? { bgcolor: theme.palette.brand.main, color: theme.palette.brand.contrastText }
                      : {
                          bgcolor: theme.tokens.neutral[100],
                          color: theme.palette.text.primary,
                          borderLeft: `3px solid ${theme.palette.brand.main}`,
                        }),
                  })}
                >
                  {entry.text}
                </Box>
                {entry.meta && (
                  <Typography variant="caption" sx={{ mt: 0.25 }}>
                    {entry.meta}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
