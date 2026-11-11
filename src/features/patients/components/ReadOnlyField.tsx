import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

/**
 * A read-only value, or "-" when empty. `field`: the live outlined field. `text`: a label over plain text
 * as a `dt`/`dd` pair, for the tabbed profile; put it inside a `dl`.
 */
export function ReadOnlyField({
  label,
  value,
  variant = 'field',
}: {
  label: string;
  value: string | null | undefined;
  variant?: 'field' | 'text';
}) {
  const text = value?.trim() ? value : '-';
  if (variant === 'text') {
    return (
      <Box sx={(theme) => ({ py: 1.25, borderBottom: `1px solid ${theme.tokens.shell.line}`, minWidth: 0 })}>
        <Box component="dt" sx={(theme) => ({ fontSize: 12, color: theme.tokens.shell.inkMuted, mb: 0.25 })}>
          {label}
        </Box>
        <Box
          component="dd"
          sx={(theme) => ({ m: 0, fontWeight: 500, color: theme.tokens.shell.ink, overflowWrap: 'anywhere' })}
        >
          {text}
        </Box>
      </Box>
    );
  }
  return (
    <TextField
      label={label}
      value={text}
      fullWidth
      slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
    />
  );
}
