'use client';

import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { LabelValueList } from '@/components/data/LabelValueList';
import { StatusChip } from '@/components/data/StatusChip';
import { FormDrawer } from '@/components/modals/FormDrawer';
import { fieldError } from '@/features/staff/staffForm';
import { cqcApi, type CqcSurveyMeasure } from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { ApiError } from '@/lib/api/http';
import { useCqcPractice } from '../CqcShell';
import { formatPoints } from '../format';
import { surveyDifference, surveyMeasureRating, surveyScore } from '../rating';

interface Values {
  practice_result: string;
  national_result: string;
  previous_result: string;
  action: string;
  owner: string;
}

const percentage = (label: string) =>
  Yup.number()
    .transform((value, original) => (original === '' ? undefined : value))
    .typeError(`${label} must be a number`)
    .min(0, `${label} must be between 0 and 100`)
    .max(100, `${label} must be between 0 and 100`);

const schema = Yup.object({
  practice_result: percentage('Practice result'),
  national_result: percentage('National result').when('practice_result', {
    is: (value: unknown) => value !== undefined && value !== '' && value !== null,
    then: (rule) => rule.required('National result is required'),
  }),
  previous_result: percentage('Previous practice result'),
});

const toNumber = (value: string) => (value === '' ? null : Number(value));

/** Enter or correct one survey measure; the difference, 1 to 4 score and rating work out as you type. */
export function SurveyMeasureDrawer({
  measure,
  onClose,
  onSaved,
}: {
  measure: CqcSurveyMeasure | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const practice = useCqcPractice();
  const { enqueueSnackbar } = useSnackbar();
  const formik = useFormik<Values>({
    enableReinitialize: true,
    initialValues: {
      practice_result: measure?.practice_result?.toString() ?? '',
      national_result: measure?.national_result?.toString() ?? '',
      previous_result: measure?.previous_result?.toString() ?? '',
      action: measure?.action ?? '',
      owner: measure?.owner ?? '',
    },
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values) => {
      if (!measure) return;
      try {
        await cqcApi.updateSurveyMeasure(PUBLIC_SUB_APP_ID, practice.id, measure.id, {
          practice_result: toNumber(values.practice_result),
          national_result: toNumber(values.national_result),
          previous_result: toNumber(values.previous_result),
          action: values.action,
          owner: values.owner,
        });
        enqueueSnackbar('Measure updated', { variant: 'success' });
        onSaved();
      } catch (error) {
        enqueueSnackbar(
          error instanceof ApiError && error.code === 400 ? error.message : 'Failed to update the measure',
          {
            variant: 'error',
          },
        );
      }
    },
  });
  const { values } = formik;
  const difference = measure
    ? surveyDifference(measure.direction, toNumber(values.practice_result), toNumber(values.national_result))
    : null;
  const score = surveyScore(difference);

  const field = (name: keyof Values, label: string, extra: { number?: boolean; multiline?: boolean } = {}) => (
    <TextField
      fullWidth
      label={label}
      type={extra.number ? 'number' : undefined}
      multiline={extra.multiline}
      minRows={extra.multiline ? 3 : undefined}
      {...formik.getFieldProps(name)}
      error={Boolean(fieldError(formik, name))}
      helperText={fieldError(formik, name)}
      slotProps={extra.number ? { htmlInput: { min: 0, max: 100, step: 0.1 } } : undefined}
    />
  );

  return (
    <FormDrawer
      open={Boolean(measure)}
      title={measure ? `Measure ${measure.id}` : ''}
      subtitle={measure?.direction === 'LOWER' ? 'Lower is better' : 'Higher is better'}
      onClose={() => {
        formik.resetForm();
        onClose();
      }}
      onSubmit={() => void formik.submitForm()}
      submitLabel="Save Changes"
      submitDisabled={!formik.isValid || !formik.dirty}
      submitting={formik.isSubmitting}
    >
      {measure && (
        <Stack spacing={2.5}>
          <LabelValueList
            items={[
              { label: 'Measure', value: measure.measure },
              { label: 'Difference vs national', value: formatPoints(difference) },
              { label: 'Score (1 to 4)', value: score ?? '-' },
              { label: 'Rating', value: <StatusChip status={surveyMeasureRating(score)} variant="outlined" /> },
            ]}
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>{field('practice_result', 'Practice result (%)', { number: true })}</Grid>
            <Grid size={{ xs: 12, sm: 6 }}>{field('national_result', 'National result (%)', { number: true })}</Grid>
          </Grid>
          {field('previous_result', 'Previous practice result (%)', { number: true })}
          {field('action', 'Action / learning', { multiline: true })}
          {field('owner', 'Owner')}
        </Stack>
      )}
    </FormDrawer>
  );
}
