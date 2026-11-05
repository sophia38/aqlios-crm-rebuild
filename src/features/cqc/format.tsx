import dayjs from 'dayjs';
import Typography from '@mui/material/Typography';
import { formatDate } from '@/lib/format';

/** A due or review date; overdue open items show in the error colour. */
export function DueDate({ date, resolved = false }: { date: string | null; resolved?: boolean }) {
  if (!date) return <>-</>;
  const overdue = !resolved && date < dayjs().format('YYYY-MM-DD');
  return (
    <Typography component="span" sx={{ fontSize: 'inherit', color: overdue ? 'error.main' : 'inherit' }}>
      {formatDate(date)}
      {overdue ? ' (overdue)' : ''}
    </Typography>
  );
}

/** Whole percentage points, signed: `+4.5pp`. */
export function formatPoints(value: number | null) {
  if (value === null) return '-';
  return `${value > 0 ? '+' : ''}${value}pp`;
}

export const optionEntries = <K extends string>(labels: Record<K, string>) =>
  (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
