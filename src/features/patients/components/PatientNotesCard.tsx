'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { patientsApi } from '@/lib/api/patients';
import type { PatientNote } from '@/lib/api/types';

const NOTE_MAX = 1000;

/** Additional Notes: inline Add Note and pale-yellow note cards with 🗑 (docs/practice/01-patients.md §2). */
export function PatientNotesCard({
  practiceId,
  patientId,
  notes,
  readOnly,
  onChange,
  collapsible,
  startAdding = false,
}: {
  practiceId: string;
  patientId: string;
  notes: PatientNote[];
  readOnly: boolean;
  onChange: (notes: PatientNote[]) => void;
  collapsible?: boolean;
  /** Open the Add Note box on mount (Add Note on the profile Overview). */
  startAdding?: boolean;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [adding, setAdding] = useState(startAdding && !readOnly);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<PatientNote | null>(null);
  const [removing, setRemoving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const note = await patientsApi.addNote(PUBLIC_SUB_APP_ID, practiceId, patientId, draft.trim());
      onChange([note, ...notes]);
      setDraft('');
      setAdding(false);
      enqueueSnackbar('Note added', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to add the note', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await patientsApi.deleteNote(PUBLIC_SUB_APP_ID, practiceId, patientId, deleting.id);
      onChange(notes.filter((note) => note.id !== deleting.id));
      setDeleting(null);
      enqueueSnackbar('Note deleted', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to delete the note', { variant: 'error' });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <FormSectionCard
      title="Additional Notes"
      collapsible={collapsible}
      actions={
        !readOnly && (
          <Button
            variant="contained"
            color="brand"
            size="small"
            startIcon={<AddCircleOutline />}
            onClick={() => setAdding(true)}
            disabled={adding}
          >
            Add Note
          </Button>
        )
      }
    >
      <Stack spacing={1.5}>
        {adding && (
          <Box>
            <TextField
              label="Note"
              required
              autoFocus
              multiline
              minRows={3}
              fullWidth
              placeholder="Add a note about this patient."
              value={draft}
              onChange={(event) => setDraft(event.target.value.slice(0, NOTE_MAX))}
              helperText={`${draft.length}/${NOTE_MAX} characters`}
              slotProps={{ htmlInput: { maxLength: NOTE_MAX } }}
            />
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setAdding(false);
                  setDraft('');
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button variant="contained" color="brand" onClick={save} loading={saving} disabled={!draft.trim()}>
                Save Note
              </Button>
            </Stack>
          </Box>
        )}
        {notes.length === 0 && !adding && (
          <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
            No notes yet.
          </Typography>
        )}
        {notes.map((note) => (
          <Box
            key={note.id}
            component="article"
            aria-label={`Note by ${note.added_by_name}`}
            sx={(theme) => ({
              p: 2,
              borderRadius: `${theme.tokens.radius.input}px`,
              bgcolor: theme.tokens.patient.noteBg,
              border: `1px solid ${theme.tokens.patient.noteBorder}`,
            })}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Typography sx={{ flex: 1, fontSize: 14, color: 'text.primary', whiteSpace: 'pre-wrap' }}>
                {note.text}
              </Typography>
              {!readOnly && (
                <Tooltip title="Delete note">
                  <IconButton
                    size="small"
                    aria-label="Delete note"
                    onClick={() => setDeleting(note)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mt: 1.5, gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption">Added By: {note.added_by_name}</Typography>
              <Typography variant="caption">{dayjs(note.created_at).format('DD/MM/YYYY HH:mm')}</Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete note?"
        message="This note will be removed from the patient's record."
        confirmButtonText="Delete Note"
        confirmButtonLoading={removing}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
    </FormSectionCard>
  );
}
