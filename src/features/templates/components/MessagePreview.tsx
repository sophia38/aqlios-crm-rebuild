'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { EntityAvatar } from '@/components/primitives/EntityAvatar';
import { SAMPLE_DATA } from '../templateLabels';

const fill = (text: string) => text.replace(/\{\{([a-z_]+)\}\}/g, (match, name: string) => SAMPLE_DATA[name] ?? match);

/** Phone-style preview of a message with sample data (COMPONENTS.md → MessagePreview). */
export function MessagePreview({
  practiceName,
  body,
  subject,
  emptyText = 'Start typing to generate a preview.',
}: {
  practiceName: string;
  /** Plain text with `{{placeholders}}`. */
  body: string;
  subject?: string | null;
  emptyText?: string;
}) {
  return (
    <Box
      aria-label="Message preview"
      role="region"
      sx={(theme) => ({
        mx: 'auto',
        width: '100%',
        maxWidth: 300,
        minHeight: 360,
        border: `8px solid ${theme.tokens.neutral[800]}`,
        borderRadius: `${theme.tokens.radius.panel}px`,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      })}
    >
      <Box
        sx={(theme) => ({
          height: 22,
          display: 'grid',
          placeItems: 'center',
          bgcolor: theme.tokens.template.previewNotch,
        })}
      >
        <Box
          sx={(theme) => ({
            width: 64,
            height: 6,
            borderRadius: `${theme.tokens.radius.pill}px`,
            bgcolor: theme.tokens.neutral[400],
          })}
        />
      </Box>
      <Stack
        direction="row"
        spacing={1}
        sx={(theme) => ({
          alignItems: 'center',
          px: 1.5,
          py: 1,
          borderBottom: `1px solid ${theme.tokens.border.medium}`,
        })}
      >
        <EntityAvatar name={practiceName} size={28} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }} noWrap>
          {practiceName}
        </Typography>
      </Stack>
      <Box sx={{ p: 1.5 }}>
        {body.trim() ? (
          <Box
            sx={(theme) => ({
              maxWidth: '90%',
              p: 1.25,
              borderRadius: `${theme.tokens.radius.input}px`,
              bgcolor: theme.tokens.template.previewBubble,
              fontSize: 13,
              color: 'text.primary',
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            })}
          >
            {subject?.trim() && (
              <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>
                {fill(subject)}
              </Typography>
            )}
            {fill(body)}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 6 }}>
            {emptyText}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
