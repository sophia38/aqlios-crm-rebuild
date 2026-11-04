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

// Leave units live with the leave API, so the mocks and Leaves pages share them.
export { dayLength, formatLeave, weeklyHours } from '@/lib/api/leave';
