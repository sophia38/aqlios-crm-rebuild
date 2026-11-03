'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { StatusChip } from '@/components/data/StatusChip';
import { ActionMenu, type ActionMenuItem } from '@/components/navigation/ActionMenu';
import { templateText } from '@/lib/api/templates';
import type { CommunicationTemplate } from '@/lib/api/types';
import { formatDate } from '@/lib/format';
import { STATUS_LABEL, TYPE_LABEL, TYPE_TONE } from '../templateLabels';

/** Splits text so `{{placeholders}}` can be shown in blue. */
export function HighlightedText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\{[a-z_]+\}\})/g).map((part, index) =>
        /^\{\{[a-z_]+\}\}$/.test(part) ? (
          <Box key={index} component="span" sx={(theme) => ({ color: theme.tokens.template.placeholderText })}>
            {part}
          </Box>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * Template card: type and status chips, ⋮ menu, name, subject, 2-line body preview, author and date
 * (COMPONENTS.md → TemplateCard). `action` replaces the ⋮ menu with one button (Browse Templates' Use Template).
 */
export function TemplateCard({
  template,
  actions = [],
  action,
}: {
  template: CommunicationTemplate;
  actions?: ActionMenuItem[];
  action?: React.ReactNode;
}) {
  return (
    <Box
      component="article"
      aria-label={template.name}
      sx={(theme) => ({
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        p: 2,
        bgcolor: theme.tokens.surface.subtleFill,
        border: `1px solid ${theme.tokens.border.medium}`,
        borderRadius: `${theme.tokens.radius.input}px`,
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <StatusChip status={TYPE_LABEL[template.type]} tone={TYPE_TONE[template.type]} variant="outlined" />
        <StatusChip status={STATUS_LABEL[template.status]} />
        <Box sx={{ flex: 1 }} />
        {action ?? <ActionMenu aria-label={`Actions for ${template.name}`} items={actions} />}
      </Stack>
      <Typography component="h4" sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
        {template.name}
      </Typography>
      {template.type === 'EMAIL' && template.subject && (
        <Typography variant="caption" sx={{ mt: -0.75 }}>
          Subject: <HighlightedText text={template.subject} />
        </Typography>
      )}
      <Typography
        variant="body2"
        sx={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          whiteSpace: 'pre-line',
        }}
      >
        <HighlightedText text={templateText(template.body)} />
      </Typography>
      {template.business_name && (
        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
          Business: {template.business_name}
        </Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', mt: 'auto', pt: 0.5 }}>
        <Typography variant="caption" noWrap>
          Created by {template.created_by_name}
        </Typography>
        <Typography variant="caption" sx={{ flexShrink: 0 }}>
          {formatDate(template.created_at)}
        </Typography>
      </Stack>
    </Box>
  );
}
