/** `2026-10-27T…` → `27/10/2026` (CLAUDE.md §5: dates display as DD/MM/YYYY everywhere). */
export function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
