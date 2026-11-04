// The Bulk Import file format, in one place. The plan approved a real .xlsx template (SheetJS); until
// that dependency is installed the import uses CSV, which needs no library (phase 5 question 2, option B).

export const IMPORT_TEMPLATE_NAME = 'aqlios_staff_import_template.csv';
export const IMPORT_ACCEPT = ['.csv', 'text/csv'];
export const IMPORT_FORMAT_LABEL = '.csv';
export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;

const COLUMNS = ['first_name', 'last_name', 'email', 'role', 'staff_type'] as const;
const HEADERS = ['First Name', 'Last Name', 'Email', 'Role', 'Staff Type'];

const quote = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** The template: the header row and two sample rows using the valid role and staff type names. */
export function buildTemplate(roles: string[], staffTypes: string[]): Blob {
  const samples = [
    ['Jo', 'Example', 'jo.example@example.com', roles.find((role) => role === 'Nurse') ?? roles[0] ?? '', 'Nurse'],
    ['Sam', 'Sample', 'sam.sample@example.com', roles.find((role) => role === 'Clinician') ?? roles[0] ?? '', 'GP'],
  ].filter((row) => staffTypes.includes(row[4]));
  const lines = [HEADERS, ...samples].map((row) => row.map(quote).join(','));
  return new Blob([`${lines.join('\n')}\n`], { type: 'text/csv' });
}

/** Splits CSV text into rows of cells (quoted cells may contain commas, quotes and line breaks). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += char;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows.filter((cells) => cells.some((value) => value.trim()));
}

const normalise = (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_');

/**
 * Reads the uploaded file into one object per staff row, keyed by column. Throws a readable error
 * when the file has no header row or misses a column.
 */
export async function readRows(file: File): Promise<Record<string, string>[]> {
  const [header, ...rows] = parseCsv(await file.text());
  if (!header) throw new Error('The file is empty.');
  const keys = header.map(normalise);
  const missing = COLUMNS.filter((column) => !keys.includes(column));
  if (missing.length) {
    throw new Error(
      `The file is missing the ${missing.map((column) => HEADERS[COLUMNS.indexOf(column)]).join(', ')} column.`,
    );
  }
  if (!rows.length) throw new Error('The file has no staff rows.');
  return rows.map((cells) =>
    Object.fromEntries(COLUMNS.map((column) => [column, (cells[keys.indexOf(column)] ?? '').trim()])),
  );
}

/** Saves a Blob as a download. */
export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
