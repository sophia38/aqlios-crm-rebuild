'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TICKET_URGENCY_LABELS, ticketsApi } from '@/lib/api/tickets';
import { TICKET_URGENCIES, type TicketDetail, type TicketUrgency } from '@/lib/api/types';

/**
 * Voice Agent Recommendations: urgency radio cards and the recommended actions. Fix: the agent's choice
 * is pre-selected (live says it picked one but shows none selected).
 */
export function RecommendationsCard({
  practiceId,
  ticket,
  locked,
  onSaved,
}: {
  practiceId: string;
  ticket: TicketDetail;
  locked: boolean;
  onSaved: (ticket: TicketDetail) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [saving, setSaving] = useState(false);

  const change = async (urgency: TicketUrgency) => {
    setSaving(true);
    try {
      onSaved(await ticketsApi.setUrgency(PUBLIC_SUB_APP_ID, practiceId, ticket.id, urgency));
      enqueueSnackbar('Urgency updated', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to update the urgency', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSectionCard title="Voice Agent Recommendations">
      <Stack spacing={2.5}>
        <Box>
          <Typography id="urgency-label" sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 1 }}>
            How clinically urgent is this consultation?
          </Typography>
          <RadioGroup
            aria-labelledby="urgency-label"
            value={ticket.urgency}
            onChange={(event) => change(event.target.value as TicketUrgency)}
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}
          >
            {TICKET_URGENCIES.map((urgency) => {
              const selected = ticket.urgency === urgency;
              return (
                <FormControlLabel
                  key={urgency}
                  value={urgency}
                  control={<Radio size="small" />}
                  label={TICKET_URGENCY_LABELS[urgency]}
                  disabled={locked || saving}
                  sx={(theme) => ({
                    m: 0,
                    pr: 1.5,
                    borderRadius: `${theme.tokens.radius.input}px`,
                    border: `1px solid ${selected ? theme.palette.primary.main : theme.tokens.border.medium}`,
                    bgcolor: selected ? theme.tokens.surface.tealLight : 'transparent',
                  })}
                />
              );
            })}
          </RadioGroup>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            {ticket.urgency_changed_by_clinician
              ? 'This urgency level was changed by a clinician.'
              : 'This urgency level was selected by the voice agent. Change it if you disagree.'}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 1 }}>
            What actions are required to solve this consultation?
          </Typography>
          {ticket.recommended_actions.length ? (
            <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14, color: 'text.primary' }}>
              {ticket.recommended_actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </Box>
          ) : (
            <Typography variant="body2">No actions recommended.</Typography>
          )}
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            These actions are prescribed by the voice agent. Change them if you disagree.
          </Typography>
        </Box>
      </Stack>
    </FormSectionCard>
  );
}
