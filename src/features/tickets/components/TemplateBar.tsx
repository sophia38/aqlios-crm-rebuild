import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LibraryBooks from '@mui/icons-material/LibraryBooksOutlined';

/** "Use Message Template" / "Use Note Template" strip with Browse Templates (captured). */
export function TemplateBar({
  title,
  description,
  disabled,
  onBrowse,
}: {
  title: string;
  description: string;
  disabled: boolean;
  onBrowse: () => void;
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      sx={(theme) => ({
        alignItems: { xs: 'stretch', sm: 'center' },
        p: 1.5,
        borderRadius: `${theme.tokens.radius.input}px`,
        bgcolor: theme.tokens.surface.subtleFill,
        border: `1px solid ${theme.tokens.border.medium}`,
      })}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
        <Typography variant="caption">{description}</Typography>
      </Box>
      <Button variant="outlined" size="small" startIcon={<LibraryBooks />} onClick={onBrowse} disabled={disabled}>
        Browse Templates
      </Button>
    </Stack>
  );
}
