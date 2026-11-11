'use client';

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles';
import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ContentCopy from '@mui/icons-material/ContentCopyOutlined';
import MailOutline from '@mui/icons-material/MailOutlineOutlined';
import PhoneOutlined from '@mui/icons-material/PhoneOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { SegmentedTabs } from '@/components/navigation/SegmentedTabs';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { patientsApi } from '@/lib/api/patients';
import type { Patient } from '@/lib/api/types';

type ContactTab = 'call' | 'message' | 'email';

const FEEDBACK_MAX = 1000;
const MESSAGE_MAX = 2000;

/**
 * Contact Patient: Call (copy number, After Call Feedback), Message and Email (captured 2026-11-03:
 * a 2000-character box and Send, no templates or sent list). Nothing is sent in the demo.
 */
export function ContactPatientCard({
  practiceId,
  patient,
  readOnly,
  collapsible,
}: {
  practiceId: string;
  patient: Patient;
  readOnly: boolean;
  collapsible?: boolean;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const phone = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const [tab, setTab] = useState<ContactTab>('call');
  const [drafts, setDrafts] = useState<Record<ContactTab, string>>({ call: '', message: '', email: '' });
  const [sending, setSending] = useState(false);
  const draft = drafts[tab];
  const max = tab === 'call' ? FEEDBACK_MAX : MESSAGE_MAX;

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(patient.phone_number);
      enqueueSnackbar('Phone number copied', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to copy the phone number', { variant: 'error' });
    }
  };

  const submit = async () => {
    setSending(true);
    const body = draft.trim();
    try {
      if (tab === 'call') {
        await patientsApi.saveCallFeedback(PUBLIC_SUB_APP_ID, practiceId, patient.id, body);
      } else {
        await patientsApi.sendMessage(PUBLIC_SUB_APP_ID, practiceId, patient.id, {
          channel: tab === 'email' ? 'EMAIL' : 'SMS',
          body,
        });
      }
      setDrafts((current) => ({ ...current, [tab]: '' }));
      enqueueSnackbar({ call: 'Feedback saved', message: 'Message sent', email: 'Email sent' }[tab], {
        variant: 'success',
      });
    } catch {
      enqueueSnackbar(
        {
          call: 'Failed to save the feedback',
          message: 'Failed to send the message',
          email: 'Failed to send the email',
        }[tab],
        { variant: 'error' },
      );
    } finally {
      setSending(false);
    }
  };

  const noEmail = tab === 'email' && !patient.email;
  const contactField =
    tab === 'email' ? (
      <TextField
        label="Email Address"
        value={patient.email || '-'}
        fullWidth
        helperText={noEmail ? 'No email address on record.' : undefined}
        slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
      />
    ) : (
      <TextField
        label="Phone Number"
        value={patient.phone_number || '-'}
        fullWidth
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            readOnly: true,
            endAdornment: patient.phone_number && !phone && (
              <InputAdornment position="end">
                <Button variant="outlined" size="small" startIcon={<ContentCopy />} onClick={copyPhone}>
                  Copy Phone Number
                </Button>
              </InputAdornment>
            ),
          },
        }}
      />
    );
  const copyBelow = tab !== 'email' && phone && patient.phone_number && (
    <Button
      variant="outlined"
      size="small"
      startIcon={<ContentCopy />}
      onClick={copyPhone}
      sx={{ alignSelf: 'flex-start' }}
    >
      Copy Phone Number
    </Button>
  );

  const box = {
    call: { label: 'After Call Feedback', placeholder: 'Record the outcome of the call.' },
    message: { label: 'Message', placeholder: 'Write an SMS to the patient.' },
    email: { label: 'Email', placeholder: 'Write an email to the patient.' },
  }[tab];

  return (
    <FormSectionCard title="Contact Patient" collapsible={collapsible}>
      <Stack spacing={2.5}>
        <Box>
          <SegmentedTabs<ContactTab>
            aria-label="Contact method"
            value={tab}
            onChange={setTab}
            items={[
              { value: 'call', label: 'Call', icon: <PhoneOutlined /> },
              { value: 'message', label: 'Message', icon: <ChatBubbleOutline /> },
              { value: 'email', label: 'Email', icon: <MailOutline /> },
            ]}
          />
        </Box>
        <Box role="tabpanel" aria-label={{ call: 'Call', message: 'Message', email: 'Email' }[tab]}>
          <Stack spacing={2.5}>
            {contactField}
            {copyBelow}
            <TextField
              label={box.label}
              placeholder={box.placeholder}
              multiline
              minRows={4}
              fullWidth
              value={draft}
              disabled={readOnly || noEmail}
              onChange={(event) => {
                const value = event.target.value.slice(0, max);
                setDrafts((current) => ({ ...current, [tab]: value }));
              }}
              helperText={`${draft.length}/${max} characters`}
              slotProps={{ htmlInput: { maxLength: max }, inputLabel: { shrink: true } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="brand"
                startIcon={tab === 'call' ? <SaveOutlined /> : <SendOutlined />}
                onClick={submit}
                loading={sending}
                disabled={readOnly || noEmail || !draft.trim()}
              >
                {{ call: 'Save Feedback', message: 'Send Message', email: 'Send Email' }[tab]}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </FormSectionCard>
  );
}
