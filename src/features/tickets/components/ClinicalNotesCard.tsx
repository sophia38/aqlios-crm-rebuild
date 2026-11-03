'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import OpenInFull from '@mui/icons-material/OpenInFull';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TICKET_NOTE_MAX, ticketsApi } from '@/lib/api/tickets';
import type { TicketDetail, TicketNote } from '@/lib/api/types';
import { formatDateTime } from '../ticketFormat';
import { CardIconButton } from './CardIconButton';
import { ExpandedDialog } from './ExpandedDialog';
import { TemplateBar } from './TemplateBar';
import { TemplatePickerDialog } from './TemplatePickerDialog';

/** Show this many saved notes in the card; the ⤢ notes history shows them all. */
const RECENT_NOTES = 2;

function NoteList({ notes }: { notes: TicketNote[] }) {
  return (
    <Stack component="ul" spacing={1.5} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {notes.map((note) => (
        <Box
          key={note.id}
          component="li"
          sx={(theme) => ({
            p: 1.5,
            borderRadius: `${theme.tokens.radius.input}px`,
            bgcolor: theme.tokens.neutral[100],
          })}
        >
          <Typography sx={{ fontSize: 14, color: 'text.primary', whiteSpace: 'pre-wrap' }}>{note.text}</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}>
            <Typography variant="caption">
              {note.added_by_name} · {formatDateTime(note.created_at)}
            </Typography>
            {note.shared_with_patient && <StatusChip status="Shared with patient" tone="info" />}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

/** Clinical Notes: Browse Templates (Note), 0/700 textarea, Share with patient, Save Notes (captured). */
export function ClinicalNotesCard({
  practiceId,
  ticket,
  locked,
  placeholders,
  onSaved,
}: {
  practiceId: string;
  ticket: TicketDetail;
  locked: boolean;
  placeholders: Record<string, string>;
  onSaved: (note: TicketNote) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [draft, setDraft] = useState('');
  const [shared, setShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const note = await ticketsApi.addNote(PUBLIC_SUB_APP_ID, practiceId, ticket.id, {
        text: draft.trim(),
        shared_with_patient: shared,
      });
      onSaved(note);
      setDraft('');
      setShared(false);
      enqueueSnackbar('Notes saved', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save the notes', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormSectionCard
      title="Clinical Notes"
      actions={
        <CardIconButton label="Open notes history" onClick={() => setExpanded(true)}>
          <OpenInFull fontSize="small" />
        </CardIconButton>
      }
    >
      <Stack spacing={2}>
        <TemplateBar
          title="Use Note Template"
          description="Browse note templates and add them to your clinical notes."
          disabled={locked}
          onBrowse={() => setBrowsing(true)}
        />
        <TextField
          label="Clinical Notes"
          placeholder="Clinical notes and observations..."
          multiline
          minRows={4}
          fullWidth
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, TICKET_NOTE_MAX))}
          disabled={locked}
          helperText={`${draft.length}/${TICKET_NOTE_MAX}`}
          slotProps={{ htmlInput: { maxLength: TICKET_NOTE_MAX } }}
        />
        <FormControlLabel
          control={
            <Checkbox checked={shared} onChange={(event) => setShared(event.target.checked)} disabled={locked} />
          }
          label="Share this note with the patient"
        />
        <Button
          variant="contained"
          color="brand"
          fullWidth
          onClick={save}
          loading={saving}
          disabled={locked || !draft.trim()}
        >
          Save Notes to Aqlios
        </Button>
        <Tooltip title="No clinical system is connected in this demo">
          <span>
            <Button variant="outlined" fullWidth disabled>
              Save Notes to Clinical System
            </Button>
          </span>
        </Tooltip>
        {ticket.notes.length > 0 && (
          <Box>
            <Typography component="h4" sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>
              Saved Notes ({ticket.notes.length})
            </Typography>
            <NoteList notes={ticket.notes.slice(0, RECENT_NOTES)} />
          </Box>
        )}
      </Stack>
      <TemplatePickerDialog
        open={browsing}
        kind="note"
        placeholders={placeholders}
        onClose={() => setBrowsing(false)}
        onUse={(text) => {
          setDraft((current) => (current ? `${current}\n${text}` : text).slice(0, TICKET_NOTE_MAX));
          setBrowsing(false);
        }}
      />
      <ExpandedDialog
        open={expanded}
        title="Clinical Notes"
        subtitle={`Notes history for ${ticket.patient_name}'s consultation`}
        onClose={() => setExpanded(false)}
      >
        {ticket.notes.length ? (
          <NoteList notes={ticket.notes} />
        ) : (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 3 }}>
            No notes yet.
          </Typography>
        )}
      </ExpandedDialog>
    </FormSectionCard>
  );
}
