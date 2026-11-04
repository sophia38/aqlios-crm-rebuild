'use client';

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import Add from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import type { GapKind, RotaGap, Shift } from '@/lib/api/types';
import { ShiftBlock } from './ShiftBlock';

const ROW = 28; // px per 30 minutes
const SLOTS = 48;
const TIME_COL = 56;
const PLUS_COL = 22;
const FIRST_VISIBLE_HOUR = 7;

const minutesOf = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
const topOf = (time: string) => (minutesOf(time) / 30) * ROW;
const slotTime = (slot: number) => `${String(Math.floor(slot / 2)).padStart(2, '0')}:${slot % 2 ? '30' : '00'}`;

/** Anything else drawn in the grid (appointments): a day and a time range. */
export interface CalendarEvent {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
}

type Item<E> =
  | { kind: 'shift'; shift: Shift; start: string; end: string }
  | { kind: 'gap'; gap: RotaGap; start: string; end: string }
  | { kind: 'event'; event: E; start: string; end: string };

/** Greedy side-by-side lanes: each item takes the first lane that's free at its start time. */
function layout<E>(items: Item<E>[]) {
  const sorted = [...items].sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end));
  const laneEnds: string[] = [];
  return sorted.map((item) => {
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = item.end;
    return { item, lane };
  });
}

export interface WeekCalendarGridProps<E extends CalendarEvent = CalendarEvent> {
  /** YYYY-MM-DD, 7 for Week or 1 for Day. */
  days: string[];
  shifts?: Shift[];
  gaps?: RotaGap[];
  /** Which gap kinds to draw (the Show filter). */
  showGaps?: GapKind[];
  /** Other blocks drawn with `renderEvent`, side by side with the shifts. */
  events?: E[];
  renderEvent?: (event: E, options: { compact: boolean }) => React.ReactNode;
  /** Omit to leave out the ＋ Assign Staff targets (Appointment has no booking from a slot). */
  onSlotClick?: (date: string, time: string) => void;
  /** Dragging down the ＋ column selects a time range (captured: live opens Assign Staff by dragging). */
  onSlotRange?: (date: string, start: string, end: string) => void;
  /** Past days ignore the ＋ targets, as live. */
  disablePast?: boolean;
  onShiftClick?: (shift: Shift) => void;
  /** "+N more" in a crowded week column opens that day in Day view. */
  onShowDay: (date: string) => void;
  loading?: boolean;
  'aria-label'?: string;
}

/**
 * Day or week grid in 30-minute rows with the today tint, a dashed now-line, ＋ Assign Staff targets and
 * shifts side by side (COMPONENTS.md → WeekCalendarGrid, docs/super-admin/06-rota-management.md).
 * `events` + `renderEvent` draw other blocks, such as appointments, in the same grid.
 */
export function WeekCalendarGrid<E extends CalendarEvent = CalendarEvent>({
  days,
  shifts = [],
  gaps = [],
  showGaps = [],
  events = [],
  renderEvent,
  onSlotClick,
  onSlotRange,
  disablePast = false,
  onShiftClick,
  onShowDay,
  loading = false,
  'aria-label': ariaLabel = 'Rota calendar',
}: WeekCalendarGridProps<E>) {
  const scroller = useRef<HTMLDivElement>(null);
  const today = dayjs().format('YYYY-MM-DD');
  // The slot range being dragged, and whether the next click should be ignored (it ended a drag).
  const [drag, setDrag] = useState<{ date: string; anchor: number; current: number } | null>(null);
  const endedDrag = useRef(false);

  useEffect(() => {
    if (!drag) return;
    const finish = () => {
      if (drag.anchor !== drag.current && onSlotRange) {
        const first = Math.min(drag.anchor, drag.current);
        const last = Math.max(drag.anchor, drag.current);
        endedDrag.current = true;
        onSlotRange(drag.date, slotTime(first), last + 1 >= SLOTS ? '23:59' : slotTime(last + 1));
      }
      setDrag(null);
    };
    window.addEventListener('pointerup', finish);
    return () => window.removeEventListener('pointerup', finish);
  }, [drag, onSlotRange]);
  const now = dayjs().format('HH:mm');
  const single = days.length === 1;
  // Week columns fit two readable blocks side by side; Day view has room for more.
  const maxLanes = single ? 6 : 2;
  const columns = `${TIME_COL}px repeat(${days.length}, minmax(${single ? 600 : 168}px, 1fr))`;

  // Open at the start of the working day, as people mostly look at 07:00 onwards.
  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = FIRST_VISIBLE_HOUR * 2 * ROW;
  }, []);

  const perDay = days.map((date) => {
    const items: Item<E>[] = [
      ...shifts
        .filter((shift) => shift.date === date)
        .map((shift) => ({ kind: 'shift' as const, shift, start: shift.start_time, end: shift.end_time })),
      ...gaps
        .filter((gap) => gap.date === date && gap.kind !== 'holiday' && showGaps.includes(gap.kind))
        .map((gap) => ({ kind: 'gap' as const, gap, start: gap.start_time, end: gap.end_time })),
      ...events
        .filter((event) => event.date === date)
        .map((event) => ({ kind: 'event' as const, event, start: event.start_time, end: event.end_time })),
    ];
    const placed = layout(items);
    const visible = placed.filter((entry) => entry.lane < maxLanes);
    const lanes = Math.min(maxLanes, Math.max(1, ...placed.map((entry) => entry.lane + 1)));
    const holiday = showGaps.includes('holiday')
      ? gaps.find((gap) => gap.date === date && gap.kind === 'holiday')
      : undefined;
    return { date, visible, lanes, hidden: placed.length - visible.length, holiday };
  });

  return (
    <Box
      ref={scroller}
      role="region"
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      tabIndex={0}
      sx={(theme) => ({
        position: 'relative',
        overflow: 'auto',
        maxHeight: 640,
        border: `1px solid ${theme.tokens.border.medium}`,
        borderRadius: `${theme.tokens.radius.input}px`,
        bgcolor: 'background.paper',
        opacity: loading ? 0.6 : 1,
        transition: theme.transitions.create('opacity'),
        '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}` },
      })}
    >
      {/* Day headers */}
      <Box
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: columns,
          position: 'sticky',
          top: 0,
          zIndex: 3,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.tokens.border.medium}`,
        })}
      >
        <Box sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }} />
        {perDay.map(({ date, hidden }) => {
          const isToday = date === today;
          return (
            <Box
              key={date}
              sx={(theme) => ({
                px: 1,
                py: 1,
                textAlign: 'center',
                bgcolor: isToday ? theme.tokens.surface.tealLight : 'transparent',
                borderBottom: `3px solid ${isToday ? theme.palette.primary.main : 'transparent'}`,
                borderLeft: `1px solid ${theme.tokens.border.medium}`,
              })}
            >
              <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>
                {dayjs(date).format('ddd')}
              </Typography>{' '}
              <Typography component="span" sx={{ fontSize: 13, color: 'text.secondary' }}>
                {dayjs(date).format('D MMM')}
              </Typography>
              {hidden > 0 && (
                <ButtonBase
                  onClick={() => onShowDay(date)}
                  aria-label={`${hidden} more on ${dayjs(date).format('dddd D MMMM')}, open Day view`}
                  sx={(theme) => ({
                    display: 'block',
                    mx: 'auto',
                    mt: 0.25,
                    px: 1,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'primary.main',
                    borderRadius: `${theme.tokens.radius.pill}px`,
                  })}
                >
                  +{hidden} more
                </ButtonBase>
              )}
            </Box>
          );
        })}
      </Box>

      {/* Body */}
      <Box sx={{ display: 'grid', gridTemplateColumns: columns, position: 'relative' }}>
        <Box sx={{ position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper' }}>
          {Array.from({ length: SLOTS }, (_, slot) => (
            <Box key={slot} sx={{ height: ROW, pr: 1, textAlign: 'right' }}>
              <Typography
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: slot % 2 ? 400 : 600,
                  color: slot % 2 ? 'text.disabled' : 'text.secondary',
                  position: 'relative',
                  top: -7,
                }}
              >
                {slotTime(slot)}
              </Typography>
            </Box>
          ))}
        </Box>
        {perDay.map(({ date, visible, lanes, holiday }) => {
          const isToday = date === today;
          const dayLabel = dayjs(date).format('ddd D MMM');
          return (
            <Box
              key={date}
              sx={(theme) => ({
                position: 'relative',
                height: SLOTS * ROW,
                borderLeft: `1px solid ${theme.tokens.border.medium}`,
                bgcolor: isToday ? theme.tokens.surface.tealLight : 'transparent',
                backgroundImage: `repeating-linear-gradient(to bottom, ${theme.tokens.border.medium} 0 1px, transparent 1px ${ROW * 2}px)`,
              })}
            >
              {/* ＋ Assign Staff targets, one per half hour */}
              {onSlotClick && (
                <Box sx={{ position: 'absolute', left: 0, top: 0, width: PLUS_COL, touchAction: 'none' }}>
                  {Array.from({ length: SLOTS }, (_, slot) => {
                    const past = disablePast && date < today;
                    const selected =
                      drag?.date === date &&
                      slot >= Math.min(drag.anchor, drag.current) &&
                      slot <= Math.max(drag.anchor, drag.current);
                    return (
                      <ButtonBase
                        key={slot}
                        aria-label={`Assign staff, ${dayLabel} ${slotTime(slot)}`}
                        title={past ? undefined : 'Assign Staff (drag to choose a time range)'}
                        disabled={past}
                        onPointerDown={(event) => {
                          if (!onSlotRange || event.button !== 0) return;
                          // Let the pointer move over other slots while dragging.
                          (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
                          setDrag({ date, anchor: slot, current: slot });
                        }}
                        onPointerEnter={() =>
                          setDrag((current) =>
                            current && current.date === date ? { ...current, current: slot } : current,
                          )
                        }
                        onClick={() => {
                          if (endedDrag.current) {
                            endedDrag.current = false;
                            return;
                          }
                          onSlotClick(date, slotTime(slot));
                        }}
                        sx={(theme) => ({
                          display: 'flex',
                          width: PLUS_COL,
                          height: ROW,
                          color: theme.palette.brand.dark,
                          opacity: past ? 0 : selected ? 1 : 0.35,
                          bgcolor: selected ? theme.palette.brand.soft : 'transparent',
                          '&:hover, &.Mui-focusVisible': { opacity: 1, bgcolor: theme.palette.brand.soft },
                        })}
                      >
                        <Add sx={{ fontSize: 14 }} />
                      </ButtonBase>
                    );
                  })}
                </Box>
              )}
              <Box sx={{ position: 'absolute', left: onSlotClick ? PLUS_COL + 2 : 4, right: 4, top: 0, bottom: 0 }}>
                {holiday && (
                  <Box
                    sx={(theme) => ({
                      position: 'absolute',
                      inset: `${topOf(holiday.start_time)}px 0 auto 0`,
                      height: topOf(holiday.end_time) - topOf(holiday.start_time),
                      border: `2px dashed ${theme.tokens.rota.gap.holiday}`,
                      borderRadius: `${theme.tokens.rota.shiftRadius}px`,
                      display: 'grid',
                      placeItems: 'center',
                      p: 1,
                    })}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 600, textAlign: 'center' }}>{holiday.label}</Typography>
                  </Box>
                )}
                {visible.map(({ item, lane }) => {
                  const height = Math.max(ROW, topOf(item.end) - topOf(item.start));
                  const position = {
                    position: 'absolute' as const,
                    top: topOf(item.start) + 1,
                    height: height - 2,
                    left: `calc(${(lane / lanes) * 100}% + 1px)`,
                    width: `calc(${100 / lanes}% - 2px)`,
                  };
                  const compact = !single || lanes > 4 || height < ROW * 6;
                  if (item.kind === 'event') {
                    return (
                      <Box key={item.event.id} sx={{ ...position, zIndex: 1 }}>
                        {renderEvent?.(item.event, { compact })}
                      </Box>
                    );
                  }
                  if (item.kind === 'shift') {
                    return (
                      <Box key={item.shift.id} sx={{ ...position, zIndex: 1 }}>
                        <ShiftBlock shift={item.shift} compact={compact} onClick={onShiftClick} />
                      </Box>
                    );
                  }
                  return (
                    <Box
                      key={item.gap.id}
                      role="note"
                      aria-label={`${item.gap.label}, ${dayLabel} ${item.gap.start_time} - ${item.gap.end_time}`}
                      sx={(theme) => ({
                        ...position,
                        border: `2px dashed ${theme.tokens.rota.gap[item.gap.kind]}`,
                        borderRadius: `${theme.tokens.rota.shiftRadius}px`,
                        p: 0.5,
                        overflow: 'hidden',
                      })}
                    >
                      <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{item.gap.label}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                        {item.gap.start_time} - {item.gap.end_time}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
        {/* Now-line across the visible days */}
        {days.includes(today) && (
          <Box
            aria-hidden
            sx={(theme) => ({
              position: 'absolute',
              left: TIME_COL - 6,
              right: 0,
              top: topOf(now),
              borderTop: `2px dashed ${theme.palette.primary.main}`,
              zIndex: 2,
              pointerEvents: 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: -7,
                borderLeft: `8px solid ${theme.palette.primary.main}`,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
              },
            })}
          />
        )}
      </Box>
    </Box>
  );
}
