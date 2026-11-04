'use client';

import { useEffect } from 'react';
import type { FormikProps } from 'formik';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { StaffDetail } from '@/lib/api/types';

/** What the page's top-right Save Changes needs from the current tab's form. */
export interface SaveBinding {
  dirty: boolean;
  submitting: boolean;
  submit: () => Promise<unknown>;
}

export interface StaffTabProps {
  staff: StaffDetail;
  /** Manager or self (Profile): self can't edit leave or competency dates, or verify documents. */
  self: boolean;
  onSaved: (staff: StaffDetail) => void;
  bind: (binding: SaveBinding | null) => void;
}

/** Hands the form's state to the page's Save Changes (and takes it back when the tab closes). */
export function useSaveBinding<Values>(formik: FormikProps<Values>, bind: StaffTabProps['bind']) {
  const { dirty, isSubmitting, submitForm } = formik;
  useEffect(() => {
    bind({ dirty, submitting: isSubmitting, submit: submitForm });
  }, [bind, dirty, isSubmitting, submitForm]);
  useEffect(() => () => bind(null), [bind]);
}

/** Touched-and-invalid message for a (possibly nested) Formik field. */
export function fieldError<Values>(formik: FormikProps<Values>, name: string): string | undefined {
  const pick = (source: unknown) =>
    name.split('.').reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], source);
  const touched = pick(formik.touched);
  const error = pick(formik.errors);
  return touched && typeof error === 'string' ? error : undefined;
}

/** Any of these fields touched and invalid: the card's red border. */
export const anyError = <Values,>(formik: FormikProps<Values>, names: string[]) =>
  names.some((name) => Boolean(fieldError(formik, name)));

/** A DD/MM/YYYY date picker bound to a YYYY-MM-DD Formik field. */
export function DateField<Values>({
  formik,
  name,
  label,
  required = false,
  disabled = false,
  helperText,
  minDate,
  maxDate,
}: {
  formik: FormikProps<Values>;
  name: string;
  label: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  minDate?: dayjs.Dayjs;
  maxDate?: dayjs.Dayjs;
}) {
  const value = name
    .split('.')
    .reduce<unknown>((source, key) => (source as Record<string, unknown> | undefined)?.[key], formik.values) as string;
  const error = fieldError(formik, name);
  return (
    <DatePicker
      label={label}
      value={value ? dayjs(value) : null}
      format="DD/MM/YYYY"
      disabled={disabled}
      minDate={minDate}
      maxDate={maxDate}
      onChange={(next) => {
        void formik.setFieldValue(name, next && next.isValid() ? next.format('YYYY-MM-DD') : '');
        void formik.setFieldTouched(name, true, false);
      }}
      slotProps={{
        textField: {
          fullWidth: true,
          required,
          error: Boolean(error),
          helperText: error ?? helperText,
          onBlur: () => void formik.setFieldTouched(name, true),
        },
        field: { clearable: !required },
      }}
    />
  );
}

/** Weekly hours from the availability rows. */
export function weeklyHours(availability: StaffDetail['account']['availability']) {
  return Object.values(availability).reduce((total, day) => {
    if (!day.open || !day.from || !day.to) return total;
    const [fh, fm] = day.from.split(':').map(Number);
    const [th, tm] = day.to.split(':').map(Number);
    return total + Math.max(0, th * 60 + tm - (fh * 60 + fm)) / 60;
  }, 0);
}

/** Hours in one working day, from the contracted week (7.5 when no hours are set). */
export function dayLength(availability: StaffDetail['account']['availability']) {
  const days = Object.values(availability).filter((day) => day.open && day.from && day.to).length;
  const hours = weeklyHours(availability);
  return days && hours ? hours / days : 7.5;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** "28 days (210 h)" (phase 5 question 3). */
export const formatLeave = (hours: number, perDay: number) => `${round(hours / perDay)} days (${round(hours)} h)`;
