// The Bulk Import file format, in one place: a real .xlsx template and upload, read and written in
// the browser with SheetJS (phase 5 question 2, option A). SheetJS is loaded only when it's needed.

export const IMPORT_TEMPLATE_NAME = 'aqlios_staff_import_template.xlsx';
export const IMPORT_ACCEPT = ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
export const IMPORT_FORMAT_LABEL = '.xlsx';
export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;

const COLUMNS = ['first_name', 'last_name', 'email', 'role', 'staff_type'] as const;
const HEADERS = ['First Name', 'Last Name', 'Email', 'Role', 'Staff Type'];
const STAFF_SHEET = 'Staff';

/**
 * The template (captured: "Includes column guidance, sample rows and the list of valid roles"): a
 * Staff sheet with the header and two sample rows, and a Guidance sheet with each column's rules
 * and the valid role and staff type names.
 */
export async function buildTemplate(roles: string[], staffTypes: string[]): Promise<Blob> {
  const XLSX = await import('xlsx');
  const role = (name: string) => roles.find((item) => item === name) ?? roles[0] ?? '';
  const samples = [
    ['Jo', 'Example', 'jo.example@example.com', role('Nurse'), 'Nurse'],
    ['Sam', 'Sample', 'sam.sample@example.com', role('Clinician'), 'GP'],
  ].filter((row) => staffTypes.includes(row[4]));
  const staff = XLSX.utils.aoa_to_sheet([HEADERS, ...samples]);
  staff['!cols'] = HEADERS.map(() => ({ wch: 26 }));

  const longest = Math.max(roles.length, staffTypes.length);
  const guidance = XLSX.utils.aoa_to_sheet([
    ['Column', 'Required', 'Guidance'],
    ['First Name', 'No', 'Up to 50 characters.'],
    ['Last Name', 'No', 'Up to 50 characters.'],
    ['Email', 'Yes', 'The invitation is sent here. Each email can be used once.'],
    ['Role', 'Yes', 'One of the valid roles below, spelt the same way.'],
    ['Staff Type', 'Yes', 'One of the valid staff types below, spelt the same way.'],
    [],
    ['Valid roles', 'Valid staff types'],
    ...Array.from({ length: longest }, (_, index) => [roles[index] ?? '', staffTypes[index] ?? '']),
    [],
    ['Delete the sample rows on the Staff sheet before importing.'],
  ]);
  guidance['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 60 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, staff, STAFF_SHEET);
  XLSX.utils.book_append_sheet(book, guidance, 'Guidance');
  const data = XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([data], { type: IMPORT_ACCEPT[1] });
}

const normalise = (header: unknown) =>
  String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

/**
 * Reads the Staff sheet (or the first sheet) into one object per staff row, keyed by column.
 * Throws a readable error when the file can't be read, has no header row or misses a column.
 */
export async function readRows(file: File): Promise<Record<string, string>[]> {
  const XLSX = await import('xlsx');
  let book: ReturnType<typeof XLSX.read>;
  try {
    book = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  } catch {
    throw new Error('The file could not be read. Upload the .xlsx template filled in.');
  }
  const sheet = book.Sheets[STAFF_SHEET] ?? book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new Error('The file is empty.');
  const [header, ...rows] = XLSX.utils
    .sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '', blankrows: false })
    .filter((cells) => cells.some((value) => String(value).trim()));
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
    Object.fromEntries(COLUMNS.map((column) => [column, String(cells[keys.indexOf(column)] ?? '').trim()])),
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
