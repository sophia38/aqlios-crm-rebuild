import TextField from '@mui/material/TextField';

/** The live read-only outlined field: the value, or "-" when empty. */
export function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <TextField
      label={label}
      value={value?.trim() ? value : '-'}
      fullWidth
      slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
    />
  );
}
