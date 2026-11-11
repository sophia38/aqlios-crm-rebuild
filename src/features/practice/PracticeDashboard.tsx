'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { visuallyHidden } from '@mui/utils';
import dayjs from 'dayjs';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined';
import GppMaybeOutlined from '@mui/icons-material/GppMaybeOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import WorkOutlineOutlined from '@mui/icons-material/WorkOutlineOutlined';
import { DashboardPanel, type DashboardPanelProps } from '@/components/data/DashboardPanel';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatTile } from '@/components/data/StatTile';
import { StatusChip } from '@/components/data/StatusChip';
import { APPOINTMENT_KIND_LABELS } from '@/lib/api/appointments';
import { COMPLIANCE_STATUS_LABELS } from '@/lib/api/compliance';
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS } from '@/lib/api/leave';
import type { LeaveRequest } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { RoleRing } from './components/RoleRing';
import { RotaWeekChart, type RotaDay } from './components/RotaWeekChart';
import { todayIso, usePracticeDashboard, weekStartIso, type Section } from './dashboard/usePracticeDashboard';
import { useCurrentPractice } from './PracticeContext';

const NOT_ALLOWED = 'Not available for your role.';

/** DashboardPanel props for a section: a 403 shows a sentence instead of Try again. */
function panelState<T>(section: Section<T>): Pick<DashboardPanelProps, 'state' | 'onRetry' | 'emptyMessage'> {
  if (section.forbidden) return { state: 'ready', emptyMessage: NOT_ALLOWED };
  return { state: section.state, onRetry: section.reload };
}

/** Value for a stat tile: null while loading, "—" when it failed. */
function tileValue<T>(section: Section<T>, value: (data: T) => React.ReactNode) {
  if (section.state === 'loading') return null;
  return section.data ? value(section.data) : '—';
}

function Row({ title, caption, end }: { title: React.ReactNode; caption?: React.ReactNode; end?: React.ReactNode }) {
  return (
    <Box
      component="li"
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.1,
        '& + &': { borderTop: `1px solid ${theme.tokens.shell.menu.divider}` },
      })}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography noWrap sx={(theme) => ({ fontSize: 13, fontWeight: 600, color: theme.tokens.shell.ink })}>
          {title}
        </Typography>
        {caption && (
          <Typography noWrap sx={(theme) => ({ fontSize: 11.5, color: theme.tokens.shell.inkMuted })}>
            {caption}
          </Typography>
        )}
      </Box>
      {end}
    </Box>
  );
}

function RowList({ children }: { children: React.ReactNode }) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {children}
    </Box>
  );
}

/** A thin horizontal meter (appointment types, coverage). */
function Meter({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        height: 6,
        borderRadius: `${theme.tokens.radius.pill}px`,
        bgcolor: theme.tokens.shell.chart.track,
        overflow: 'hidden',
      })}
    >
      <Box
        sx={{ height: '100%', width: `${max ? (value / max) * 100 : 0}%`, bgcolor: color, borderRadius: 'inherit' }}
      />
    </Box>
  );
}

const sessionOf = (start: string) => (start < '12:00' ? 'Morning' : start < '17:00' ? 'Afternoon' : 'Evening');
const shortDate = (iso: string) => dayjs(iso).format('D MMM');
const leaveDates = (request: LeaveRequest) =>
  request.start_date === request.end_date
    ? shortDate(request.start_date)
    : `${dayjs(request.start_date).format('D')}–${shortDate(request.end_date)}`;
const days = (request: LeaveRequest) => {
  const count = Math.max(1, Math.round(request.duration_hours / (request.day_hours || 7.5)));
  return `${count} day${count === 1 ? '' : 's'}`;
};

/**
 * Practice dashboard (Figma "Public GP Flows" 9107:72525): six KPI tiles, the rota week, who works
 * here, scheduling coverage, appointments this week, who's on today, leave, the compliance watchlist
 * and the practice's details. Each panel loads from an existing practice API on its own.
 */
export function PracticeDashboard() {
  const theme = useTheme();
  const practice = useCurrentPractice();
  const { staff, rota, appointments, leave, compliance, patients } = usePracticeDashboard(practice.id);
  const today = todayIso();
  const weekStart = weekStartIso();
  const tones = theme.tokens.shell.vertical;
  const alertTone = { bg: theme.tokens.tone.error.strongBg, fg: theme.tokens.tone.error.main };

  // ---- Rota: per-day covered and open slots (bank holidays aren't slots), coverage, today.
  const week = Array.from({ length: 7 }, (_, offset) => dayjs(weekStart).add(offset, 'day').format('YYYY-MM-DD'));
  const openGaps = rota.data?.gaps.filter((gap) => gap.kind !== 'holiday') ?? [];
  const rotaDays: RotaDay[] = week.map((date) => ({
    date,
    covered: rota.data?.shifts.filter((shift) => shift.date === date).length ?? 0,
    needsCover: openGaps.filter((gap) => gap.date === date).length,
  }));
  const covered = rota.data?.shifts.length ?? 0;
  const slots = covered + openGaps.length;
  const coverage = slots ? Math.round((covered / slots) * 100) : null;
  const gapsAhead = openGaps.filter((gap) => gap.date >= today).length;
  const onToday = [
    ...(rota.data?.shifts ?? [])
      .filter((shift) => shift.date === today)
      .map((shift) => ({
        id: shift.id,
        start: shift.start_time,
        end: shift.end_time,
        name: shift.staff_name,
        detail: `${sessionOf(shift.start_time)} · ${shift.role_name}`,
        status: 'Covered',
      })),
    ...openGaps
      .filter((gap) => gap.date === today)
      .map((gap) => ({
        id: gap.id,
        start: gap.start_time,
        end: gap.end_time,
        name: gap.label,
        detail: sessionOf(gap.start_time),
        status: 'Needs cover',
      })),
  ].sort((a, b) => a.start.localeCompare(b.start));

  // ---- Staff by role.
  const roleCounts = Object.entries(
    (staff.data?.members ?? []).reduce<Record<string, number>>((counts, member) => {
      counts[member.role_name || 'No role'] = (counts[member.role_name || 'No role'] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count || a.role.localeCompare(b.role));

  // ---- Appointments this week.
  const appointmentRows = appointments.data?.results ?? [];
  const completed = appointmentRows.filter((row) => row.status === 'COMPLETED').length;
  const cancelled = appointmentRows.filter((row) => row.status.startsWith('CANCELLED')).length;
  const dna = appointmentRows.filter((row) => row.status === 'DNA').length;
  const booked = appointmentRows.length - completed - cancelled - dna;
  const byType = Object.entries(
    appointmentRows.reduce<Record<string, number>>((counts, row) => {
      counts[row.type] = (counts[row.type] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const topType = byType[0]?.[1] ?? 0;
  const appointmentParts = [
    { label: 'Completed', count: completed, color: theme.tokens.shell.chart.covered },
    { label: 'Still booked', count: booked, color: theme.tokens.shell.chart.booked },
    { label: 'Did not attend', count: dna, color: theme.tokens.shell.chart.needsCover },
    { label: 'Cancelled', count: cancelled, color: theme.tokens.shell.chart.cancelled },
  ].filter((part) => part.count > 0);

  // ---- Leave and compliance.
  const pendingLeave = leave.data?.pending.results ?? [];
  const recentLeave = (leave.data?.history.results ?? []).slice(0, Math.max(0, 4 - pendingLeave.length));
  const watch = (compliance.data?.results ?? []).filter((row) =>
    ['EXPIRED', 'REVERIFICATION_DUE'].includes(row.compliance_status),
  );
  const expired = compliance.data?.summary.expired ?? 0;
  const lapsing = expired + (compliance.data?.summary.reverification_due ?? 0);

  const address = [practice.address_line_1, practice.address_line_2, practice.city, practice.postcode]
    .filter(Boolean)
    .join(', ');

  return (
    <Box sx={{ display: 'grid', gap: 1.75 }}>
      <Typography component="h1" sx={visuallyHidden}>
        {practice.practice_name} dashboard
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 1.75,
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
            xl: 'repeat(6, minmax(0, 1fr))',
          },
        }}
      >
        <StatTile
          label="Staff on the books"
          icon={<GroupsOutlined />}
          tone={tones.private}
          value={staff.forbidden ? '—' : tileValue(staff, (data) => data.summary.total)}
          caption={
            staff.forbidden
              ? NOT_ALLOWED
              : staff.data && `${staff.data.summary.active} active · ${staff.data.summary.pending_invitations} invited`
          }
        />
        <StatTile
          label="Rota coverage this week"
          icon={<CalendarMonthOutlined />}
          tone={tones.public}
          value={tileValue(rota, () => (coverage === null ? '—' : `${coverage}%`))}
          caption={slots ? `${covered} of ${slots} slots covered` : 'No rota this week'}
        />
        <StatTile
          label="Shifts needing cover"
          icon={<WarningAmberOutlined />}
          tone={tones.everyclinic}
          value={tileValue(rota, () => gapsAhead)}
          caption="from today to Sunday"
        />
        <StatTile
          label="Appointments this week"
          icon={<EventNoteOutlined />}
          tone={tones.public}
          value={tileValue(appointments, (data) => data.count)}
          caption={`${appointmentRows.filter((row) => row.date === today).length} today`}
        />
        <StatTile
          label="Leave to approve"
          icon={<WorkOutlineOutlined />}
          tone={tones.everyclinic}
          value={leave.forbidden ? '—' : tileValue(leave, (data) => data.pending.count)}
          caption={leave.forbidden ? NOT_ALLOWED : 'awaiting a decision'}
        />
        <StatTile
          label="Certifications lapsing"
          icon={<GppMaybeOutlined />}
          tone={alertTone}
          value={compliance.forbidden ? '—' : tileValue(compliance, () => lapsing)}
          caption={compliance.forbidden ? NOT_ALLOWED : `${expired} already expired`}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.75,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))', lg: '1.2fr 1fr 1fr' },
        }}
      >
        <DashboardPanel
          title="The rota week"
          subtitle={`${shortDate(week[0])} – ${shortDate(week[6])} · ${covered} of ${slots} slots covered`}
          {...panelState(rota)}
          emptyMessage={rota.state === 'ready' && !slots ? 'Nothing on the rota this week.' : undefined}
        >
          <RotaWeekChart days={rotaDays} today={today} />
        </DashboardPanel>

        <DashboardPanel
          title="Who works here"
          subtitle={`${staff.data?.members.length ?? 0} on the books`}
          {...panelState(staff)}
          emptyMessage={
            staff.forbidden ? NOT_ALLOWED : staff.state === 'ready' && !roleCounts.length ? 'No staff yet.' : undefined
          }
        >
          <RoleRing roles={roleCounts} />
        </DashboardPanel>

        <DashboardPanel title="Scheduling coverage" subtitle="Slots with somebody against them" {...panelState(rota)}>
          <Typography
            sx={(theme) => ({ fontSize: 34, fontWeight: 700, lineHeight: 1.1, color: theme.tokens.shell.ink })}
          >
            {coverage === null ? '—' : `${coverage}%`}
          </Typography>
          <Typography sx={(theme) => ({ mt: 0.5, mb: 1.5, fontSize: 12, color: theme.tokens.shell.inkMuted })}>
            {slots ? `${covered} of ${slots} slots this week have somebody on them.` : 'No rota this week.'}
          </Typography>
          <Meter value={covered} max={slots} color={theme.palette.primary.main} />
          <Box sx={{ mt: 2 }}>
            <LabelValueList
              labelWidth={200}
              items={[
                { label: 'Shifts needing cover', value: String(gapsAhead) },
                { label: 'Leave awaiting approval', value: leave.data ? String(leave.data.pending.count) : '—' },
                { label: 'Certifications expired', value: compliance.data ? String(expired) : '—' },
              ]}
            />
          </Box>
        </DashboardPanel>
      </Box>

      <Box sx={{ display: 'grid', gap: 1.75, gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '1.4fr 1fr' } }}>
        <DashboardPanel
          title="Appointments this week"
          subtitle={`${appointments.data?.count ?? 0} booked · ${appointmentRows.filter((row) => row.date === today).length} today`}
          {...panelState(appointments)}
          emptyMessage={
            appointments.state === 'ready' && !appointmentRows.length ? 'No appointments this week.' : undefined
          }
        >
          <Box
            aria-hidden
            sx={(theme) => ({
              display: 'flex',
              gap: 0.5,
              height: 12,
              borderRadius: `${theme.tokens.radius.pill}px`,
              overflow: 'hidden',
            })}
          >
            {appointmentParts.map((part) => (
              <Box key={part.label} sx={{ flex: part.count, bgcolor: part.color }} />
            ))}
          </Box>
          <Box
            component="ul"
            sx={(theme) => ({
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              listStyle: 'none',
              m: 0,
              mt: 1.25,
              mb: 2,
              p: 0,
              fontSize: 12,
              color: theme.tokens.shell.ink,
            })}
          >
            {appointmentParts.map((part) => (
              <Box component="li" key={part.label} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: part.color }} />
                {part.label} <strong>{part.count}</strong>
              </Box>
            ))}
          </Box>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5 }}>
            {byType.map(([type, count]) => (
              <Box component="li" key={type}>
                <Box
                  sx={(theme) => ({
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                    fontSize: 12.5,
                    color: theme.tokens.shell.ink,
                  })}
                >
                  <span>{APPOINTMENT_KIND_LABELS[type as keyof typeof APPOINTMENT_KIND_LABELS] ?? type}</span>
                  <strong>{count}</strong>
                </Box>
                <Meter value={count} max={topType} color={theme.tokens.shell.chart.bar} />
              </Box>
            ))}
          </Box>
        </DashboardPanel>

        <DashboardPanel
          title="On today"
          subtitle={dayjs(today).format('ddd D MMM')}
          {...panelState(rota)}
          emptyMessage={rota.state === 'ready' && !onToday.length ? 'Nobody is on the rota today.' : undefined}
        >
          <RowList>
            {onToday.map((item) => (
              <Row
                key={item.id}
                title={
                  <>
                    <Box
                      component="span"
                      sx={(theme) => ({
                        display: 'inline-block',
                        mr: 1.25,
                        px: 1,
                        py: 0.25,
                        fontSize: 11.5,
                        fontWeight: 600,
                        borderRadius: `${theme.tokens.radius.iconTile}px`,
                        bgcolor:
                          item.status === 'Covered'
                            ? theme.tokens.shell.accentSoft
                            : theme.tokens.tone.warning.strongBg,
                        color:
                          item.status === 'Covered'
                            ? theme.tokens.shell.accentInk
                            : theme.tokens.tone.warning.strongInk,
                      })}
                    >
                      {item.start}–{item.end}
                    </Box>
                    {item.name}
                  </>
                }
                caption={item.detail}
                end={<StatusChip status={item.status} />}
              />
            ))}
          </RowList>
        </DashboardPanel>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.75,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' },
        }}
      >
        <DashboardPanel
          title="Leave"
          subtitle={`${leave.data?.pending.count ?? 0} awaiting approval`}
          {...panelState(leave)}
          emptyMessage={
            leave.state === 'ready' && !pendingLeave.length && !recentLeave.length
              ? 'No leave requests yet.'
              : undefined
          }
        >
          <RowList>
            {[...pendingLeave, ...recentLeave].map((request) => (
              <Row
                key={request.id}
                title={request.staff_name}
                caption={`${LEAVE_TYPE_LABELS[request.leave_type].replace(/ Leave.*$/, '')} · ${leaveDates(request)} · ${days(request)}`}
                end={
                  <StatusChip status={request.status === 'PENDING' ? 'Pending' : LEAVE_STATUS_LABELS[request.status]} />
                }
              />
            ))}
          </RowList>
        </DashboardPanel>

        <DashboardPanel
          title="Compliance watchlist"
          subtitle={`${expired} expired · ${lapsing - expired} due for re-verification`}
          {...panelState(compliance)}
          emptyMessage={
            compliance.state === 'ready' && !watch.length ? 'Everyone’s certificates are in date.' : undefined
          }
        >
          <RowList>
            {watch.slice(0, 6).map((row) => (
              <Row
                key={row.id}
                title={`${row.first_name} ${row.last_name}`}
                caption={`${row.role_name} · updated ${formatDate(row.last_updated)}`}
                end={<StatusChip status={COMPLIANCE_STATUS_LABELS[row.compliance_status]} />}
              />
            ))}
          </RowList>
        </DashboardPanel>
      </Box>

      <DashboardPanel title="Practice details" state="ready">
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          <LabelValueList
            items={[
              { label: 'ODS code', value: practice.ods_code },
              { label: 'Email', value: practice.email_address ?? '' },
              { label: 'On the platform since', value: formatDate(practice.created_at) },
            ]}
          />
          <LabelValueList
            items={[
              { label: 'Address', value: address },
              { label: 'Registered patients', value: patients.data === null ? '' : String(patients.data) },
              { label: 'PCN', value: practice.pcn_name },
            ]}
          />
          <LabelValueList
            items={[
              { label: 'Telephone', value: practice.phone_number },
              { label: 'Practice manager', value: practice.practice_manager_name },
              { label: 'CQC number', value: practice.cqc_no ?? '' },
            ]}
          />
        </Box>
      </DashboardPanel>
    </Box>
  );
}
