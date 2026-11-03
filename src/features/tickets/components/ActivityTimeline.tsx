import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StatusChip } from '@/components/data/StatusChip';
import type { TicketLog } from '@/lib/api/types';
import { formatDateTime } from '../ticketFormat';

/**
 * Consultation Logs timeline (COMPONENTS.md → ActivityTimeline): green dot, actor and event, the user
 * line, a role chip and a DD/MM/YYYY HH:mm timestamp (live: "26 October 2026 at 16:57").
 */
export function ActivityTimeline({ entries }: { entries: TicketLog[] }) {
  return (
    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {entries.map((entry, index) => (
        <Box
          key={entry.id}
          component="li"
          sx={(theme) => ({
            position: 'relative',
            pl: 3,
            pb: index === entries.length - 1 ? 0 : 2.5,
            // The line joining the dots.
            '&::before':
              index === entries.length - 1
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    left: 5,
                    top: 16,
                    bottom: 0,
                    width: '2px',
                    bgcolor: theme.tokens.neutral[200],
                  },
          })}
        >
          <Box
            aria-hidden
            sx={(theme) => ({
              position: 'absolute',
              left: 0,
              top: 4,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: theme.tokens.tone.success.main,
            })}
          />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, color: 'text.primary', overflowWrap: 'anywhere' }}>
                <Box component="span" sx={{ fontWeight: 700 }}>
                  {entry.actor}
                </Box>{' '}
                {entry.event}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                User: {entry.user_name} ({entry.role})
              </Typography>
            </Box>
            <Stack spacing={0.5} sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
              <StatusChip status={entry.role} tone="info" />
              <Typography variant="caption">{formatDateTime(entry.created_at)}</Typography>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
