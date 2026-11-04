'use client';

import { useId } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Close from '@mui/icons-material/Close';
import { LabelValueList, type LabelValueItem } from '@/components/data/LabelValueList';
import { formatFileSize, HR_POLICY_CATEGORY_LABELS } from '@/lib/api/hrPolicies';
import type { HrPolicy } from '@/lib/api/types';

/**
 * A policy's details and the numbered clauses Ask HR quotes from (plan §7: View). Read-only, label
 * left and value right with only the ✕, like Leave Request Details.
 */
export function PolicyDetailsDialog({ policy, onClose }: { policy: HrPolicy | null; onClose: () => void }) {
  const titleId = useId();
  if (!policy) return null;
  const items: LabelValueItem[] = [
    { label: 'Category', value: HR_POLICY_CATEGORY_LABELS[policy.category] },
    { label: 'Owner', value: policy.owner_name ?? '—' },
    { label: 'Effective Date', value: policy.effective_date ? dayjs(policy.effective_date).format('DD/MM/YYYY') : '—' },
    { label: 'Version', value: `v${policy.version}` },
    { label: 'File', value: `${policy.file_name} (${formatFileSize(policy.file_size)})` },
    { label: 'Uploaded', value: `${policy.uploaded_by}, ${dayjs(policy.updated_at).format('DD/MM/YYYY HH:mm')}` },
    { label: 'Description', value: policy.description || '—' },
  ];

  return (
    <Dialog
      open
      onClose={onClose}
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          sx: (theme) => ({ width: 560, maxWidth: 'calc(100% - 32px)', borderRadius: `${theme.tokens.radius.base}px` }),
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
          <Typography id={titleId} component="h2" variant="h6" sx={{ fontWeight: 700 }}>
            {policy.title}
          </Typography>
          <IconButton aria-label="Close" size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        <LabelValueList items={items} labelWidth={110} />
        <Typography component="h3" sx={{ fontSize: 16, fontWeight: 600, mt: 3, mb: 1.5 }}>
          What Ask HR Answers From
        </Typography>
        {policy.sections.length ? (
          <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {policy.sections.map((section) => (
              <Box
                component="li"
                key={section.number}
                sx={(theme) => ({
                  p: 1.5,
                  borderRadius: `${theme.tokens.radius.input}px`,
                  bgcolor: theme.tokens.neutral[100],
                })}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {section.number} {section.heading}
                </Typography>
                <Typography variant="body2">{section.text}</Typography>
              </Box>
            ))}
          </Stack>
        ) : (
          <Alert severity="info">
            The demo keeps only the file name of uploaded policies, so there are no clauses for Ask HR to quote.
          </Alert>
        )}
      </Box>
    </Dialog>
  );
}
