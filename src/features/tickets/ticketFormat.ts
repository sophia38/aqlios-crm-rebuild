import dayjs from 'dayjs';

/** `DD/MM/YYYY HH:mm`, 24-hour (plan: "Applies to every module"). */
export const formatDateTime = (iso: string) => dayjs(iso).format('DD/MM/YYYY HH:mm');

/** 42 → "42s", 125 → "2m 05s" (the transcript header). */
export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
}

/** The transcript header: "26/10/2026 · 16:57 – 16:58 · 42s". */
export function transcriptHeading(startedAt: string, durationSeconds: number) {
  const start = dayjs(startedAt);
  const end = start.add(durationSeconds, 'second');
  return `${start.format('DD/MM/YYYY')} · ${start.format('HH:mm')} – ${end.format('HH:mm')} · ${formatDuration(durationSeconds)}`;
}
