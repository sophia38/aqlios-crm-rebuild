import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

export interface RotaDay {
  /** YYYY-MM-DD */
  date: string;
  covered: number;
  needsCover: number;
}

/** Stacked day bars for the practice dashboard's "The rota week": covered below, needs cover on top. */
export function RotaWeekChart({ days, today }: { days: RotaDay[]; today: string }) {
  const max = Math.max(1, ...days.map((day) => day.covered + day.needsCover));
  const summary = days
    .map((day) => `${dayjs(day.date).format('dddd')}: ${day.covered} covered, ${day.needsCover} needing cover`)
    .join('; ');
  return (
    <Box>
      <Box
        role="img"
        aria-label={summary}
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 1, alignItems: 'end' }}
      >
        {days.map((day) => {
          const total = day.covered + day.needsCover;
          const isToday = day.date === today;
          return (
            <Box key={day.date} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={(theme) => ({ fontSize: 11, fontWeight: 600, color: theme.tokens.shell.ink })}>
                {total || ''}
              </Typography>
              <Box
                sx={(theme) => ({
                  width: '100%',
                  maxWidth: 30,
                  height: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  borderRadius: `${theme.tokens.radius.iconTile / 2}px`,
                  overflow: 'hidden',
                })}
              >
                <Box
                  sx={(theme) => ({
                    height: `${(day.needsCover / max) * 100}%`,
                    bgcolor: theme.tokens.shell.chart.needsCover,
                  })}
                />
                <Box
                  sx={(theme) => ({
                    height: `${(day.covered / max) * 100}%`,
                    bgcolor: theme.tokens.shell.chart.covered,
                  })}
                />
              </Box>
              <Box sx={{ textAlign: 'center', lineHeight: 1.2 }}>
                <Typography
                  sx={(theme) => ({
                    fontSize: 11,
                    fontWeight: isToday ? 600 : 400,
                    color: isToday ? theme.palette.primary.main : theme.tokens.shell.ink,
                  })}
                >
                  {dayjs(day.date).format('ddd')}
                </Typography>
                <Typography
                  sx={(theme) => ({
                    fontSize: 10,
                    color: isToday ? theme.palette.primary.main : theme.tokens.shell.inkMuted,
                  })}
                >
                  {dayjs(day.date).format('D')}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box
        aria-hidden
        sx={(theme) => ({
          display: 'flex',
          gap: 2,
          mt: 1.5,
          fontSize: 12,
          color: theme.tokens.shell.ink,
          '& span': { display: 'inline-flex', alignItems: 'center', gap: 0.75 },
          '& i': { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
        })}
      >
        <span>
          <Box component="i" sx={(theme) => ({ bgcolor: theme.tokens.shell.chart.covered })} />
          Covered
        </span>
        <span>
          <Box component="i" sx={(theme) => ({ bgcolor: theme.tokens.shell.chart.needsCover })} />
          Needs cover
        </span>
      </Box>
    </Box>
  );
}
