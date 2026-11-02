'use client';

import { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { DayHours } from '@/components/forms/OperatingHoursRow';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import type { DaySchedule, Role } from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';

/** Monday first on the Settings pages (live order here; the practice forms start on Sunday). */
export const WEEK: { key: DaySchedule['day']; label: string }[] = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
];

export const toDayHours = (day: DaySchedule): DayHours => ({
  open: day.is_open,
  from: day.opening_time,
  to: day.closing_time,
});

export const fromDayHours = (day: DaySchedule['day'], hours: DayHours): DaySchedule => ({
  day,
  is_open: hours.open,
  opening_time: hours.from,
  closing_time: hours.to,
});

export const HOURS_ERROR = 'Closing time must be after opening time';

/** Error text for an open day whose closing time isn't after its opening time. */
export const dayError = (day: DaySchedule) =>
  day.is_open && day.opening_time && day.closing_time && day.closing_time <= day.opening_time ? HOURS_ERROR : undefined;

/** Digits only, for hour/day/minute fields (live accepts any value; the rebuild limits them). */
export const digits = (value: string, max = 4) => value.replace(/\D/g, '').slice(0, max);

/** Every role, for the Role selects (`?is_paginated=false`). */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    usersApi
      .allRoles(PUBLIC_SUB_APP_ID, controller.signal)
      .then(setRoles)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return roles;
}

/**
 * Cancel and Save Changes, top-left under the section title as live; both stay disabled until
 * something changes. Cancel puts the saved values back.
 */
export function SectionActions() {
  const { dirty, isSubmitting, resetForm } = useFormikContext();
  return (
    <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
      <Button
        variant="outlined"
        disabled={!dirty || isSubmitting}
        onClick={() => resetForm()}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3, bgcolor: 'background.paper' })}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="contained"
        disabled={!dirty}
        loading={isSubmitting}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
      >
        Save Changes
      </Button>
    </Stack>
  );
}

/** "(Optional)" / "(Mandatory)" after a section title. */
export function SectionTag({ children }: { children: string }) {
  return (
    <Typography component="span" sx={{ fontSize: 14, fontWeight: 400, color: 'text.secondary', ml: 0.75 }}>
      ({children})
    </Typography>
  );
}
