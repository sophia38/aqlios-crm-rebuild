'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Assignment from '@mui/icons-material/AssignmentOutlined';
import Medication from '@mui/icons-material/MedicationOutlined';
import QrCode from '@mui/icons-material/QrCode2Outlined';
import Science from '@mui/icons-material/ScienceOutlined';
import { LabelValueList } from '@/components/data/LabelValueList';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { SNOMED_COMMENT_MAX, SNOMED_MIN_SEARCH, ticketsApi } from '@/lib/api/tickets';
import type { SnomedConcept, TicketDetail, TicketSnomedCode } from '@/lib/api/types';
import { formatDateTime } from '../ticketFormat';

export type SummaryTab = 'summary' | 'snomed' | 'tests' | 'medication';

const notProvided = (value: string | null) =>
  value || (
    <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
      Not provided
    </Box>
  );

/** Summary tabs: Consultation Summary · SNOMED codes · Requested Tests & Documents · Medication (captured). */
export function SummaryCard({
  practiceId,
  ticket,
  locked,
  tab,
  onTabChange,
  onCodeAdded,
}: {
  practiceId: string;
  ticket: TicketDetail;
  locked: boolean;
  tab: SummaryTab;
  onTabChange: (tab: SummaryTab) => void;
  onCodeAdded: (code: TicketSnomedCode) => void;
}) {
  const labels: Record<SummaryTab, string> = {
    summary: 'Consultation Summary',
    snomed: 'SNOMED codes',
    tests: 'Requested Tests & Documents',
    medication: 'Medication',
  };
  return (
    <FormSectionCard title="Consultation">
      <Stack spacing={2.5}>
        <SegmentedTabs<SummaryTab>
          aria-label="Consultation sections"
          tone="brand"
          size="small"
          value={tab}
          onChange={onTabChange}
          items={[
            { value: 'summary', label: labels.summary, icon: <Assignment /> },
            { value: 'snomed', label: labels.snomed, icon: <QrCode /> },
            { value: 'tests', label: labels.tests, icon: <Science /> },
            { value: 'medication', label: labels.medication, icon: <Medication /> },
          ]}
        />
        <Box role="tabpanel" aria-label={labels[tab]}>
          {tab === 'summary' && (
            <Stack spacing={2}>
              <Box
                sx={(theme) => ({
                  p: 2,
                  borderRadius: `${theme.tokens.radius.input}px`,
                  bgcolor: theme.tokens.neutral[100],
                })}
              >
                <LabelValueList
                  labelWidth={140}
                  items={[
                    { label: 'Presenting Complaint', value: notProvided(ticket.summary.presenting_complaint) },
                    { label: 'Current Condition History', value: notProvided(ticket.summary.condition_history) },
                    { label: 'Timeframe', value: notProvided(ticket.summary.timeframe) },
                    { label: 'Symptoms', value: notProvided(ticket.summary.symptoms) },
                  ]}
                />
              </Box>
              <Box
                sx={(theme) => ({
                  p: 2,
                  borderRadius: `${theme.tokens.radius.input}px`,
                  bgcolor: theme.tokens.tone.error.strongBg,
                  color: theme.tokens.tone.error.main,
                })}
              >
                <Typography component="h4" sx={{ fontSize: 14, fontWeight: 700, color: 'inherit', mb: 0.5 }}>
                  Red Flags
                </Typography>
                {ticket.red_flags.length ? (
                  <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 14 }}>
                    {ticket.red_flags.map((flag) => (
                      <li key={flag}>{flag}</li>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 14, color: 'inherit' }}>No red flags identified</Typography>
                )}
              </Box>
            </Stack>
          )}
          {tab === 'snomed' && (
            <SnomedPanel practiceId={practiceId} ticket={ticket} locked={locked} onCodeAdded={onCodeAdded} />
          )}
          {tab === 'tests' && <PlainList items={ticket.requested_tests} empty="No requested tests or documents" />}
          {tab === 'medication' && <PlainList items={ticket.medication} empty="No medication prescribed" />}
        </Box>
      </Stack>
    </FormSectionCard>
  );
}

function PlainList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) {
    return (
      <Typography variant="body2" sx={{ textAlign: 'center', py: 3, fontStyle: 'italic' }}>
        {empty}
      </Typography>
    );
  }
  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {items.map((item) => (
        <Box
          key={item}
          component="li"
          sx={(theme) => ({
            px: 2,
            py: 1.25,
            fontSize: 14,
            borderRadius: `${theme.tokens.radius.input}px`,
            bgcolor: theme.tokens.neutral[100],
          })}
        >
          {item}
        </Box>
      ))}
    </Stack>
  );
}

function SnomedPanel({
  practiceId,
  ticket,
  locked,
  onCodeAdded,
}: {
  practiceId: string;
  ticket: TicketDetail;
  locked: boolean;
  onCodeAdded: (code: TicketSnomedCode) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<SnomedConcept[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SnomedConcept | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const term = input.trim();
  const ready = term.length >= SNOMED_MIN_SEARCH;

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      ticketsApi
        .searchSnomed(term, controller.signal)
        .then(setOptions)
        .catch(() => {
          if (!controller.signal.aborted) enqueueSnackbar('Failed to search SNOMED codes', { variant: 'error' });
        })
        .finally(() => !controller.signal.aborted && setSearching(false));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term, ready, enqueueSnackbar]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const code = await ticketsApi.addSnomedCode(PUBLIC_SUB_APP_ID, practiceId, ticket.id, {
        code: selected.code,
        comment: comment.trim(),
      });
      onCodeAdded(code);
      setSelected(null);
      setInput('');
      setComment('');
      enqueueSnackbar('SNOMED code added', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error instanceof Error && error.message ? error.message : 'Failed to add the SNOMED code', {
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Typography component="h4" sx={{ fontSize: 15, fontWeight: 600 }}>
        Add SNOMED code
      </Typography>
      <Autocomplete
        options={ready ? options : []}
        value={selected}
        onChange={(_, next) => setSelected(next)}
        inputValue={input}
        onInputChange={(_, next) => setInput(next)}
        getOptionLabel={(option) => `${option.code} · ${option.term}`}
        isOptionEqualToValue={(option, value) => option.code === value.code}
        getOptionDisabled={(option) => ticket.snomed_codes.some((code) => code.code === option.code)}
        filterOptions={(items) => items}
        loading={searching}
        noOptionsText={ready ? 'No codes found. Try another search.' : 'Type at least 3 characters'}
        disabled={locked}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search codes"
            placeholder="Search by term or code"
            helperText="Type at least 3 characters"
          />
        )}
      />
      <TextField
        label="Comment (Optional)"
        placeholder="Add comment here..."
        value={comment}
        onChange={(event) => setComment(event.target.value.slice(0, SNOMED_COMMENT_MAX))}
        disabled={locked}
        helperText={`${comment.length}/${SNOMED_COMMENT_MAX} characters`}
        slotProps={{ htmlInput: { maxLength: SNOMED_COMMENT_MAX } }}
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="No clinical system is connected in this demo">
          <span>
            <Button variant="outlined" disabled fullWidth>
              Add and Save to Clinical System
            </Button>
          </span>
        </Tooltip>
        <Button variant="contained" color="brand" onClick={save} loading={saving} disabled={locked || !selected}>
          Add and Save to Aqlios
        </Button>
      </Stack>
      <Typography component="h4" sx={{ fontSize: 15, fontWeight: 600 }}>
        Saved SNOMED codes
      </Typography>
      {ticket.snomed_codes.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
          No SNOMED codes saved yet.
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Saved SNOMED codes" sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell>Saved SNOMED codes</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Date & Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ticket.snomed_codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell>
                    {code.code} · {code.term}
                  </TableCell>
                  <TableCell>{code.comment || '-'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(code.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
