'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import OpenInFull from '@mui/icons-material/OpenInFull';
import Refresh from '@mui/icons-material/Refresh';
import Send from '@mui/icons-material/Send';
import { ChatThread, type ChatThreadEntry } from '@/components/data/ChatThread';
import { StatusChip } from '@/components/data/StatusChip';
import { AppSwitch } from '@/components/forms/AppSwitch';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TICKET_CHANNEL_LABELS, TICKET_MESSAGE_MAX, ticketsApi } from '@/lib/api/tickets';
import type { TicketDetail, TicketMessage, TicketMessageChannel } from '@/lib/api/types';
import { formatDateTime } from '../ticketFormat';
import { CardIconButton } from './CardIconButton';
import { ExpandedDialog } from './ExpandedDialog';
import { TemplateBar } from './TemplateBar';
import { TemplatePickerDialog } from './TemplatePickerDialog';

const CHANNELS: TicketMessageChannel[] = ['SMS', 'EMAIL', 'APP', 'NHS_APP'];

function entries(messages: TicketMessage[]): ChatThreadEntry[] {
  return messages.map((message) => ({
    id: message.id,
    side: message.sender === 'STAFF' ? 'end' : 'start',
    author: message.sender_name,
    time: formatDateTime(message.created_at),
    text: message.body,
    meta:
      message.sender === 'STAFF'
        ? `Sent via ${message.channels.map((channel) => TICKET_CHANNEL_LABELS[channel]).join(', ')}`
        : undefined,
  }));
}

/** Chat with Patient: messages, Browse Templates and a composer with Send As options (captured 2026-11-03). */
export function ChatCard({
  practiceId,
  ticket,
  locked,
  placeholders,
  onRefresh,
  onSent,
}: {
  practiceId: string;
  ticket: TicketDetail;
  locked: boolean;
  placeholders: Record<string, string>;
  onRefresh: () => void;
  onSent: (message: TicketMessage) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState('');
  const [channels, setChannels] = useState<TicketMessageChannel[]>(['APP']);
  const [replyAllowed, setReplyAllowed] = useState(true);
  const [sending, setSending] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const thread = entries(ticket.messages);

  const send = async () => {
    setSending(true);
    try {
      const message = await ticketsApi.sendMessage(PUBLIC_SUB_APP_ID, practiceId, ticket.id, {
        body: draft.trim(),
        channels,
        reply_allowed: replyAllowed,
      });
      onSent(message);
      setDraft('');
      enqueueSnackbar('Message sent', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to send the message', { variant: 'error' });
    } finally {
      setSending(false);
    }
  };

  const toggleChannel = (channel: TicketMessageChannel) =>
    setChannels((current) =>
      current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel],
    );

  return (
    <FormSectionCard
      title="Chat with Patient"
      actions={
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <StatusChip status={`Preferred Method: ${ticket.preferred_method}`} tone="neutral" variant="outlined" />
          </Box>
          <CardIconButton label="Refresh messages" onClick={onRefresh}>
            <Refresh fontSize="small" />
          </CardIconButton>
          <CardIconButton label="Open full conversation" onClick={() => setExpanded(true)}>
            <OpenInFull fontSize="small" />
          </CardIconButton>
        </Stack>
      }
    >
      <Stack spacing={2}>
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <StatusChip status={`Preferred Method: ${ticket.preferred_method}`} tone="neutral" variant="outlined" />
        </Box>
        <TemplateBar
          title="Use Message Template"
          description="Browse categorised templates and instantly apply them to the patient conversation."
          disabled={locked}
          onBrowse={() => setBrowsing(true)}
        />
        <ChatThread
          aria-label="Messages with the patient"
          entries={thread}
          emptyText="No messages yet"
          maxHeight={320}
        />
        <Box
          component="form"
          aria-label="Message the patient"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim() && channels.length && !sending) send();
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
            <TextField
              label="Message"
              placeholder="Type a message..."
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, TICKET_MESSAGE_MAX))}
              disabled={locked}
              helperText={`${draft.length}/${TICKET_MESSAGE_MAX} characters`}
              slotProps={{ htmlInput: { maxLength: TICKET_MESSAGE_MAX } }}
            />
            <Tooltip title="Send message">
              <span>
                <IconButton
                  type="submit"
                  aria-label="Send message"
                  disabled={locked || sending || !draft.trim() || !channels.length}
                  sx={(theme) => ({
                    mb: 3.5,
                    bgcolor: theme.palette.brand.main,
                    color: theme.palette.brand.contrastText,
                    '&:hover': { bgcolor: theme.palette.brand.dark },
                    '&.Mui-disabled': { bgcolor: theme.tokens.neutral[200] },
                  })}
                >
                  <Send fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Typography component="p" sx={{ fontSize: 13, fontWeight: 600, mt: 1 }} id="send-as-label">
            Send As
          </Typography>
          <FormGroup row aria-labelledby="send-as-label">
            {CHANNELS.map((channel) => (
              <FormControlLabel
                key={channel}
                control={
                  <Checkbox
                    size="small"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    disabled={locked}
                  />
                }
                label={TICKET_CHANNEL_LABELS[channel]}
                slotProps={{ typography: { sx: { fontSize: 13 } } }}
              />
            ))}
          </FormGroup>
          {!locked && !channels.length && (
            <Typography variant="caption" sx={{ color: 'error.main' }}>
              Choose at least one way to send the message.
            </Typography>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 3 }} sx={{ mt: 0.5 }}>
            <FormControlLabel
              control={
                <AppSwitch
                  checked={replyAllowed}
                  onChange={(event) => setReplyAllowed(event.target.checked)}
                  disabled={locked}
                />
              }
              label="Patient Reply Allowed"
              slotProps={{ typography: { sx: { fontSize: 13 } } }}
            />
            <Tooltip title="No clinical system is connected in this demo">
              <FormControlLabel
                control={<AppSwitch checked={false} disabled />}
                label="Save Message in Clinical System"
                slotProps={{ typography: { sx: { fontSize: 13 } } }}
              />
            </Tooltip>
          </Stack>
        </Box>
      </Stack>
      <TemplatePickerDialog
        open={browsing}
        kind="message"
        placeholders={placeholders}
        onClose={() => setBrowsing(false)}
        onUse={(text) => {
          setDraft(text.slice(0, TICKET_MESSAGE_MAX));
          setBrowsing(false);
        }}
      />
      <ExpandedDialog
        open={expanded}
        title="Chat with Patient"
        subtitle={`Full conversation with ${ticket.patient_name}`}
        onClose={() => setExpanded(false)}
      >
        <ChatThread aria-label="Full conversation" entries={thread} emptyText="No messages yet" />
      </ExpandedDialog>
    </FormSectionCard>
  );
}
