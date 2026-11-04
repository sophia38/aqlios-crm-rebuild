'use client';

import { useEffect, useRef, useState } from 'react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import PersonOutline from '@mui/icons-material/PersonOutlineOutlined';
import SendOutlined from '@mui/icons-material/SendOutlined';
import { ChatThread, type ChatThreadEntry } from '@/components/data/ChatThread';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { citeSource, HR_QUESTION_MAX, HR_SUGGESTED_QUESTIONS, hrPoliciesApi } from '@/lib/api/hrPolicies';
import { ApiError } from '@/lib/api/http';
import { UploadPolicyModal } from './components/UploadPolicyModal';
import { HrCard, HrPoliciesFrame } from './HrPoliciesFrame';
import { PoliciesEmptyState } from './PolicyLibraryPage';

/**
 * Ask HR (docs/practice/08-hr-policies-and-settings.md §1, plan §7): suggested questions fill the
 * composer, Enter sends and Shift+Enter adds a line. Answers quote the matching clause and cite
 * "Policy, section x.y" (the answer view was never captured: the live practice has no policies).
 * The conversation lasts until you leave the page.
 */
export function AskHrPage() {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const composer = useRef<HTMLTextAreaElement>(null);
  const [policyCount, setPolicyCount] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [entries, setEntries] = useState<ChatThreadEntry[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    hrPoliciesApi
      .list(PUBLIC_SUB_APP_ID, practice.id, { page: 1, page_size: 1 }, controller.signal)
      .then((result) => setPolicyCount(result.count))
      .catch(() => !controller.signal.aborted && enqueueSnackbar('Failed to load policies', { variant: 'error' }));
    return () => controller.abort();
  }, [practice.id, reloadKey, enqueueSnackbar]);

  const send = async () => {
    const text = question.trim();
    if (!text || asking) return;
    const time = dayjs().format('HH:mm');
    const id = `${Date.now()}`;
    setAsking(true);
    setEntries((current) => [
      ...current,
      { id: `${id}-q`, side: 'end', author: 'You', text, time, icon: <PersonOutline /> },
    ]);
    setQuestion('');
    try {
      const answer = await hrPoliciesApi.ask(PUBLIC_SUB_APP_ID, practice.id, text);
      setEntries((current) => [
        ...current,
        {
          id: `${id}-a`,
          side: 'start',
          author: 'Ask HR',
          text: answer.answer,
          time: dayjs().format('HH:mm'),
          icon: <AutoAwesomeOutlined />,
          meta: answer.sources.length
            ? `${answer.sources.length === 1 ? 'Source' : 'Sources'}: ${answer.sources.map(citeSource).join(' · ')}`
            : undefined,
        },
      ]);
    } catch (error) {
      // Put the question back so it can be sent again.
      setEntries((current) => current.filter((entry) => entry.id !== `${id}-q`));
      setQuestion(text);
      enqueueSnackbar(error instanceof ApiError && error.code === 400 ? error.message : 'Failed to get an answer', {
        variant: 'error',
      });
    } finally {
      setAsking(false);
      composer.current?.focus();
    }
  };

  const suggest = (text: string) => {
    setQuestion(text);
    composer.current?.focus();
  };

  return (
    <HrPoliciesFrame tab="ask">
      <HrCard
        title="Ask HR"
        subtitle="Ask a question and get an answer from your practice's own policies, with sources."
      >
        <Stack spacing={2.5}>
          {policyCount === 0 && (
            <PoliciesEmptyState
              icon={<AutoAwesomeOutlined />}
              title="Ask About Your Practice's HR Policies"
              text="Your practice has no policies yet. Upload the staff handbook and HR policies so staff can ask questions here."
              actionLabel="Upload a Policy"
              onAction={() => setUploading(true)}
            />
          )}
          {entries.length > 0 && (
            <ChatThread entries={entries} aria-label="Ask HR conversation" emptyText="" maxHeight={480} />
          )}
          {asking && (
            <Stack direction="row" spacing={1} role="status" sx={{ alignItems: 'center', color: 'text.secondary' }}>
              <CircularProgress size={16} color="inherit" />
              <Typography variant="body2">Looking through your practice&apos;s policies…</Typography>
            </Stack>
          )}
          {entries.length === 0 && (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Try asking</Typography>
              <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                {HR_SUGGESTED_QUESTIONS.map((item) => (
                  <Button key={item} variant="outlined" size="small" onClick={() => suggest(item)}>
                    {item}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
          <Box
            component="form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void send();
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'flex-start' } }}>
              <TextField
                inputRef={composer}
                fullWidth
                multiline
                minRows={2}
                maxRows={8}
                label="Ask a question about your policies"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void send();
                  }
                }}
                slotProps={{ htmlInput: { maxLength: HR_QUESTION_MAX } }}
                helperText={
                  <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <span>Enter to send, Shift+Enter for a new line</span>
                    <span>
                      {question.length}/{HR_QUESTION_MAX}
                    </span>
                  </Box>
                }
              />
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendOutlined />}
                disabled={!question.trim() || asking}
                sx={{ flexShrink: 0, mt: { sm: 1 } }}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </Stack>
      </HrCard>
      <UploadPolicyModal
        open={uploading}
        onClose={() => setUploading(false)}
        onSaved={() => {
          setUploading(false);
          setReloadKey((key) => key + 1);
        }}
      />
    </HrPoliciesFrame>
  );
}
