'use client';

import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccessTime from '@mui/icons-material/AccessTime';
import CalendarViewWeekOutlined from '@mui/icons-material/CalendarViewWeekOutlined';
import { StatusChip } from '@/components/data/StatusChip';
import { ConfirmDialog, type ConfirmDialogProps } from '@/components/modals/ConfirmDialog';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { DUTY_TYPE_LABELS, rotaApi } from '@/lib/api/rota';
import type { PublishedSlot, SlotBid } from '@/lib/api/types';
import { hoursBetweenTimes } from './rotaFormat';

type Pending =
  | { action: 'claim'; slot: PublishedSlot }
  | { action: 'decline'; slot: PublishedSlot }
  | { action: 'accept'; slot: PublishedSlot; bid: SlotBid };

const money = (value: number) => `£${value.toFixed(2).replace(/\.00$/, '')}`;

/**
 * Shift Bidding (docs/practice/06-rota-management.md §2, plan §5): this practice's published slots
 * for the next 4 weeks. Staff claim or decline; managers see the bids and accept one, which turns
 * the slot into a shift. Confirm copy from docs/practice/09-confirmation-popups.md.
 */
export function ShiftBiddingTab({ practiceId, isManager }: { practiceId: string; isManager: boolean }) {
  const { enqueueSnackbar } = useSnackbar();
  const [slots, setSlots] = useState<PublishedSlot[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    rotaApi
      .publishedSlots(PUBLIC_SUB_APP_ID, practiceId, controller.signal)
      .then(setSlots)
      .catch(() => {
        if (controller.signal.aborted) return;
        setSlots([]);
        enqueueSnackbar('Failed to load published slots', { variant: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, reloadKey, enqueueSnackbar]);

  const run = async () => {
    if (!pending) return;
    const toasts = {
      claim: ['Shift claimed', 'Failed to claim the shift'],
      decline: ['Shift declined', 'Failed to decline the shift'],
      accept: ['Bid accepted', 'Failed to accept the bid'],
    } as const;
    setBusy(true);
    try {
      if (pending.action === 'claim') await rotaApi.claimSlot(PUBLIC_SUB_APP_ID, pending.slot.id);
      else if (pending.action === 'decline') await rotaApi.declineSlot(PUBLIC_SUB_APP_ID, pending.slot.id);
      else await rotaApi.acceptBid(PUBLIC_SUB_APP_ID, pending.slot.id, pending.bid.id);
      enqueueSnackbar(toasts[pending.action][0], { variant: 'success' });
      setPending(null);
      setReloadKey((key) => key + 1);
    } catch (error) {
      enqueueSnackbar(error instanceof ApiError && error.code === 400 ? error.message : toasts[pending.action][1], {
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const confirm: Omit<ConfirmDialogProps, 'open' | 'onClose' | 'onConfirm'> | null = !pending
    ? null
    : pending.action === 'claim'
      ? {
          title: 'Claim Shift',
          message: 'Are you sure you want to claim this shift?',
          confirmButtonText: 'Claim Shift',
          confirmButtonVariant: 'primary',
        }
      : pending.action === 'decline'
        ? {
            title: 'Decline Shift',
            message: 'Are you sure you want to decline this shift opportunity?',
            confirmButtonText: 'Decline Shift',
            confirmButtonVariant: 'error',
          }
        : {
            title: 'Accept Bid',
            message: `Are you sure you want to accept this bid from ${pending.bid.staff_name} at ${money(
              pending.slot.rate_per_hour * hoursBetweenTimes(pending.slot.start_time, pending.slot.end_time),
            )}? This will assign the slot to them.`,
            confirmButtonText: 'Accept Bid',
            confirmButtonVariant: 'success',
          };

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <CalendarViewWeekOutlined aria-hidden sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box>
          <Typography component="h2" variant="pageTitle">
            ROTA Management
          </Typography>
          <Typography variant="body2">Shift Bidding</Typography>
        </Box>
      </Stack>
      <Box sx={{ height: 4 }}>{slots === null && <LinearProgress aria-label="Loading published slots" />}</Box>
      {slots !== null && slots.length === 0 ? (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 6 }}>
          No shifts open for bidding right now.
        </Typography>
      ) : (
        <Grid container spacing={2} component="ul" aria-label="Published slots" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {(slots ?? []).map((slot) => {
            const hours = hoursBetweenTimes(slot.start_time, slot.end_time);
            const closed = slot.bidding_closes < dayjs().format('YYYY-MM-DD');
            return (
              <Grid key={slot.id} size={{ xs: 12, md: 6, xl: 4 }} component="li">
                <Box
                  aria-label={`${dayjs(slot.date).format('dddd DD/MM/YYYY')}, ${slot.start_time} - ${slot.end_time}`}
                  sx={(theme) => ({
                    height: '100%',
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: `${theme.tokens.radius.card}px`,
                    border: `1px solid ${theme.tokens.border.medium}`,
                    borderLeft: `6px solid ${theme.tokens.rota.gap.published}`,
                  })}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box>
                      <Typography sx={{ fontSize: 15, fontWeight: 700, color: 'text.primary' }}>
                        {dayjs(slot.date).format('dddd DD/MM/YYYY')}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.5 }}>
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} aria-hidden />
                        <Typography variant="body2">
                          {slot.start_time} - {slot.end_time} ({hours}h)
                        </Typography>
                      </Stack>
                    </Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                      {money(slot.rate_per_hour)}/hour
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                    <StatusChip status={DUTY_TYPE_LABELS[slot.duty_type]} tone="primary" variant="outlined" />
                    <StatusChip
                      status={`${String(slot.bids.length).padStart(2, '0')} Eligible ${slot.bids.length === 1 ? 'Bid' : 'Bids'}`}
                      tone="info"
                    />
                    {slot.my_bid && <StatusChip status="Claimed" tone="success" />}
                    {slot.declined && <StatusChip status="Declined" tone="neutral" />}
                  </Stack>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    {closed ? 'Bidding closed' : `Bidding closes ${dayjs(slot.bidding_closes).format('DD/MM/YYYY')}`}
                  </Typography>
                  {isManager ? (
                    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, mt: 1.5, p: 0 }} aria-label="Bids">
                      {slot.bids.length === 0 && <Typography variant="body2">No bids yet.</Typography>}
                      {slot.bids.map((bid) => (
                        <Stack
                          key={bid.id}
                          component="li"
                          direction="row"
                          spacing={1}
                          sx={(theme) => ({
                            alignItems: 'center',
                            p: 1,
                            borderRadius: `${theme.tokens.radius.input}px`,
                            bgcolor: theme.tokens.neutral[50],
                          })}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{bid.staff_name}</Typography>
                            <Typography variant="caption">{bid.role_name}</Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            aria-label={`Accept bid from ${bid.staff_name}`}
                            onClick={() => setPending({ action: 'accept', slot, bid })}
                          >
                            Accept Bid
                          </Button>
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={slot.my_bid || closed}
                        onClick={() => setPending({ action: 'claim', slot })}
                      >
                        Claim
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={slot.declined}
                        onClick={() => setPending({ action: 'decline', slot })}
                      >
                        Decline
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}
      {pending && confirm && (
        <ConfirmDialog
          open
          {...confirm}
          confirmButtonLoading={busy}
          onClose={() => setPending(null)}
          onConfirm={() => void run()}
        />
      )}
    </Stack>
  );
}
