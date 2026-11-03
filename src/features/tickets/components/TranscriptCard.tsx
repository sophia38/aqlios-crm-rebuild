'use client';

import { useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OpenInFull from '@mui/icons-material/OpenInFull';
import SmartToy from '@mui/icons-material/SmartToyOutlined';
import { ChatThread, type ChatThreadEntry } from '@/components/data/ChatThread';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import type { TicketDetail } from '@/lib/api/types';
import { transcriptHeading } from '../ticketFormat';
import { CardIconButton } from './CardIconButton';
import { ExpandedDialog } from './ExpandedDialog';

/**
 * Voice Consultation Transcript (Voice Agent) or Web Pathway Answers (Web Triage): AI Assistant on
 * the left, the patient on the right, in a scrolling area (captured).
 */
export function TranscriptCard({ ticket }: { ticket: TicketDetail }) {
  const [expanded, setExpanded] = useState(false);
  const title = ticket.source === 'VOICE_AGENT' ? 'Voice Consultation Transcript' : 'Web Pathway Answers';
  const heading = transcriptHeading(ticket.transcript.started_at, ticket.transcript.duration_seconds);
  const entries: ChatThreadEntry[] = ticket.transcript.entries.map((entry, index) => ({
    id: String(index),
    side: entry.speaker === 'AI' ? 'start' : 'end',
    author: entry.speaker === 'AI' ? 'AI Assistant' : ticket.patient_name,
    icon: entry.speaker === 'AI' ? <SmartToy /> : undefined,
    text: entry.text,
  }));

  return (
    <FormSectionCard
      title={title}
      actions={
        <CardIconButton label="Open full transcript" onClick={() => setExpanded(true)}>
          <OpenInFull fontSize="small" />
        </CardIconButton>
      }
    >
      <Stack spacing={1.5}>
        <Typography variant="caption">{heading}</Typography>
        <ChatThread aria-label={title} entries={entries} emptyText="No transcript available." maxHeight={360} />
      </Stack>
      <ExpandedDialog open={expanded} title={title} subtitle={heading} onClose={() => setExpanded(false)}>
        <ChatThread aria-label={`Full ${title.toLowerCase()}`} entries={entries} emptyText="No transcript available." />
      </ExpandedDialog>
    </FormSectionCard>
  );
}
