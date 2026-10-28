'use client';

import { useEffect, useState } from 'react';
import { getIn, useFormikContext, type FormikErrors, type FormikTouched } from 'formik';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi } from '@/lib/api/practiceManagement';
import { sectionOf, type SectionKey } from './practiceForm';

/** Error text for a field, shown once it's touched or the form was submitted (blur + submit, CLAUDE.md §4). */
export function useFieldError() {
  const { errors, touched, submitCount } = useFormikContext<object>();
  return (path: string): string | undefined => {
    const error = getIn(errors, path);
    const visible = submitCount > 0 || Boolean(getIn(touched, path));
    return visible && typeof error === 'string' ? error : undefined;
  };
}

/** Standard props for a MUI TextField bound to a Formik field. */
export function useTextField() {
  const formik = useFormikContext<object>();
  const errorOf = useFieldError();
  return (path: string) => {
    const error = errorOf(path);
    return {
      id: path,
      name: path,
      value: (getIn(formik.values, path) as string | undefined) ?? '',
      onChange: formik.handleChange,
      onBlur: formik.handleBlur,
      error: Boolean(error),
      helperText: error,
    };
  };
}

/** Sections that currently show an error (for the red card border). */
export function useSectionErrors(): Set<SectionKey> {
  const { errors, touched, submitCount } = useFormikContext<object>();
  const sections = new Set<SectionKey>();
  for (const [field, error] of Object.entries(errors as FormikErrors<Record<string, unknown>>)) {
    if (!error) continue;
    const shown = submitCount > 0 || hasTouched((touched as FormikTouched<Record<string, unknown>>)[field]);
    const section = sectionOf(field);
    if (shown && section) sections.add(section);
  }
  return sections;
}

function hasTouched(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some(hasTouched);
  if (typeof value === 'object') return Object.values(value as object).some(hasTouched);
  return false;
}

/** After a failed submit, scroll to and focus the first invalid field (rebuild improvement). */
export function focusFirstError() {
  window.requestAnimationFrame(() => {
    const first = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-section-error="true"]');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (first?.matches('input, textarea, [tabindex]')) first.focus({ preventScroll: true });
  });
}

export type NameStatus = 'idle' | 'checking' | 'available' | 'taken';

/** Checks practice-name uniqueness 500ms after the name stops changing (live `name-availability`). */
export function useNameAvailability(name: string, excludePracticeId?: string, initialName?: string): NameStatus {
  const [status, setStatus] = useState<NameStatus>('idle');
  const [checkedName, setCheckedName] = useState(name);
  const trimmed = name.trim();

  if (checkedName !== name) {
    setCheckedName(name);
    setStatus(!trimmed || trimmed === initialName ? 'idle' : 'checking');
  }

  useEffect(() => {
    if (!trimmed || trimmed === initialName) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      practiceManagementApi
        .nameAvailability(PUBLIC_SUB_APP_ID, trimmed, excludePracticeId, controller.signal)
        .then((result) => setStatus(result.is_available ? 'available' : 'taken'))
        .catch(() => !controller.signal.aborted && setStatus('idle'));
    }, 500);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, excludePracticeId, initialName]);

  return status;
}

export const NAME_TAKEN_MESSAGE = 'A practice with this name already exists.';
