'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import { StatusChip } from '@/components/data/StatusChip';
import { usePracticeHref } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { DUTY_TYPE_LABELS, rotaApi } from '@/lib/api/rota';
import type { RotaGap, Shift } from '@/lib/api/types';

type Entry = { id: string; date: string; start_time: string; end_time: string; label: React.ReactNode };

const mondayOf = (day: dayjs.Dayjs) => day.subtract((day.day() + 6) % 7, 'day');

/**
 * "My shifts this week and next" (phase 5 question 8): the signed-in user's shifts and approved leave
 * from the ROTA, so the page matches its name. Live shows no ROTA content here.
 */
export function MyShiftsCard({ practiceId, staffId }: { practiceId: string; staffId: string }) {
  const practiceHref = usePracticeHref();
  const { enqueueSnackbar } = useSnackbar();
  const [weeks, setWeeks] = useState<{ start: string; entries: Entry[] }[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const starts = [mondayOf(dayjs()), mondayOf(dayjs()).add(1, 'week')].map((day) => day.format('YYYY-MM-DD'));
    const today = dayjs().format('YYYY-MM-DD');
    Promise.all(
      starts.map((start) =>
        rotaApi.week(
          PUBLIC_SUB_APP_ID,
          { week_start: start, practice_id: practiceId, staff_id: staffId },
          controller.signal,
        ),
      ),
    )
      .then((results) =>
        setWeeks(
          results.map((week, index) => {
            const shifts = week.shifts.map((shift: Shift) => ({
              id: shift.id,
              date: shift.date,
              start_time: shift.start_time,
              end_time: shift.end_time,
              label: <StatusChip status={DUTY_TYPE_LABELS[shift.duty_type]} tone="primary" variant="outlined" />,
            }));
            const leave = week.gaps
              .filter((gap: RotaGap) => gap.kind === 'leave' && gap.staff_id === staffId)
              .map((gap) => ({
                id: gap.id,
                date: gap.date,
                start_time: gap.start_time,
                end_time: gap.end_time,
                label: <StatusChip status="On Leave" tone="warning" />,
              }));
            return {
              start: starts[index],
              entries: [...shifts, ...leave]
                .filter((entry) => entry.date >= today)
                .sort((a, b) => `${a.date}${a.start_time}`.localeCompare(`${b.date}${b.start_time}`)),
            };
          }),
        ),
      )
      .catch(() => {
        if (controller.signal.aborted) return;
        setWeeks([]);
        enqueueSnackbar('Failed to load your shifts', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, staffId, enqueueSnackbar]);

  const empty = weeks !== null && weeks.every((week) => week.entries.length === 0);

  return (
    <Box
      component="section"
      aria-labelledby="my-shifts-title"
      sx={(theme) => ({
        p: { xs: 2, md: 3 },
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.card}px`,
        border: `1px solid ${theme.tokens.border.medium}`,
      })}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box>
          <Typography id="my-shifts-title" component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>
            My Shifts
          </Typography>
          <Typography variant="body2">This week and next, from the ROTA.</Typography>
        </Box>
        <Button
          component={Link}
          href={practiceHref('/rota')}
          variant="outlined"
          size="small"
          startIcon={<CalendarMonthOutlined />}
        >
          Open ROTA
        </Button>
      </Stack>
      <Box sx={{ height: 4 }}>{weeks === null && <LinearProgress aria-label="Loading your shifts" />}</Box>
      {empty ? (
        <Typography variant="body2" sx={{ py: 1 }}>
          You have no shifts this week or next.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {(weeks ?? [])
            .filter((week) => week.entries.length)
            .map((week) => (
              <Box key={week.start}>
                <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
                  {week.start === mondayOf(dayjs()).format('YYYY-MM-DD') ? 'This week' : 'Next week'}
                </Typography>
                <Stack
                  component="ul"
                  spacing={1}
                  aria-label={`Shifts, week of ${dayjs(week.start).format('DD/MM/YYYY')}`}
                  sx={{ listStyle: 'none', m: 0, p: 0 }}
                >
                  {week.entries.map((entry) => (
                    <Stack
                      key={entry.id}
                      component="li"
                      direction="row"
                      spacing={1.5}
                      sx={(theme) => ({
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        rowGap: 0.5,
                        px: 1.5,
                        py: 1,
                        borderRadius: `${theme.tokens.radius.input}px`,
                        bgcolor: theme.tokens.neutral[50],
                      })}
                    >
                      <Typography sx={{ fontSize: 14, fontWeight: 600, minWidth: 130 }}>
                        {dayjs(entry.date).format('ddd DD/MM/YYYY')}
                      </Typography>
                      <Typography variant="body2" sx={{ minWidth: 100 }}>
                        {entry.start_time} - {entry.end_time}
                      </Typography>
                      {entry.label}
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
        </Stack>
      )}
    </Box>
  );
}
