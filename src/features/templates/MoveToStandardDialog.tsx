'use client';

import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { FormModal } from '@/components/modals/FormModal';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { templatesApi, templateText } from '@/lib/api/templates';
import { TEMPLATE_CATEGORIES, type CommunicationTemplate, type TemplateCategory } from '@/lib/api/types';
import { HighlightedText } from './components/TemplateCard';
import { TYPE_LABEL } from './templateLabels';

const BODY_MAX = 1000;

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Plain text from the review form back to the HTML the templates store: one paragraph per line. */
const toHtml = (text: string) =>
  text
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');

/**
 * Move to Standard Templates review form (docs/practice/09-confirmation-popups.md, Template Library):
 * 900px, the original template, then editable standard details.
 */
export function MoveToStandardDialog({
  template,
  onClose,
  onMoved,
}: {
  template: CommunicationTemplate | null;
  onClose: () => void;
  onMoved: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const isEmail = template?.type === 'EMAIL';
  const schema = Yup.object({
    name: Yup.string().trim().required('Template name is required'),
    category: Yup.string().required('Category is required'),
    subject: isEmail ? Yup.string().trim().required('Subject is required') : Yup.string(),
    body: Yup.string()
      .trim()
      .required('Template body is required')
      .max(BODY_MAX, `Template body must be ${BODY_MAX} characters or fewer`),
  });

  return (
    <Formik
      key={template?.id ?? 'none'}
      enableReinitialize
      initialValues={{
        name: template?.name ?? '',
        category: (template?.category ?? '') as TemplateCategory | '',
        subject: template?.subject ?? '',
        body: template ? templateText(template.body) : '',
      }}
      validationSchema={schema}
      validateOnMount
      onSubmit={async (values) => {
        if (!template) return;
        try {
          await templatesApi.moveToStandard(PUBLIC_SUB_APP_ID, template.id, {
            name: values.name.trim(),
            category: values.category as TemplateCategory,
            subject: isEmail ? values.subject.trim() : null,
            body: toHtml(values.body.trim()),
          });
          enqueueSnackbar('Template moved to Standard Templates successfully.', { variant: 'success' });
          onMoved();
        } catch {
          enqueueSnackbar('Failed to move template to Standard Templates.', { variant: 'error' });
        }
      }}
    >
      {(formik) => {
        const errorOf = (field: keyof typeof formik.values) =>
          formik.submitCount > 0 || formik.touched[field] ? formik.errors[field] : undefined;
        const field = (name: 'name' | 'subject', label: string) => (
          <TextField
            id={`move-${name}`}
            name={name}
            label={label}
            required
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={Boolean(errorOf(name))}
            helperText={errorOf(name)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        );
        const original = (label: string, value: React.ReactNode) => (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 1.5 }}>
            <Typography variant="body2" sx={{ minWidth: 80, fontWeight: 600, color: 'text.primary' }}>
              {label}
            </Typography>
            <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-line' }}>
              {value}
            </Typography>
          </Stack>
        );

        return (
          <FormModal
            open={Boolean(template)}
            size="lg"
            title="Move to Standard Templates"
            subtitle="Review and refine this staff-created template before making it available across the vertical."
            onClose={onClose}
            onSubmit={() => formik.handleSubmit()}
            submitLabel="Move to Standard"
            submitting={formik.isSubmitting}
            footer={
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  disabled={formik.isSubmitting}
                  sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="brand"
                  disabled={!formik.isValid}
                  loading={formik.isSubmitting}
                  sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
                >
                  Move to Standard
                </Button>
              </Stack>
            }
          >
            {template && (
              <Box
                component="section"
                aria-label="Original template"
                sx={(theme) => ({
                  p: 2,
                  bgcolor: theme.tokens.neutral[100],
                  borderRadius: `${theme.tokens.radius.input}px`,
                })}
              >
                <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                  Original template
                </Typography>
                <Stack spacing={1}>
                  {original('Author', template.created_by_name)}
                  {original('Category', template.category)}
                  {original('Type', TYPE_LABEL[template.type])}
                  {isEmail && original('Subject', <HighlightedText text={template.subject ?? ''} />)}
                  {original('Body', <HighlightedText text={templateText(template.body)} />)}
                </Stack>
              </Box>
            )}
            <Typography component="h3" sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
              Standard template details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>{field('name', 'Template Name')}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  id="move-category"
                  name="category"
                  label="Category"
                  required
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={Boolean(errorOf('category'))}
                  helperText={errorOf('category')}
                  slotProps={{ inputLabel: { shrink: true } }}
                >
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            {isEmail && field('subject', 'Subject')}
            <TextField
              id="move-body"
              name="body"
              label="Template Body"
              required
              multiline
              minRows={5}
              value={formik.values.body}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={Boolean(errorOf('body'))}
              helperText={errorOf('body') ?? `Character limit: ${formik.values.body.length}/${BODY_MAX}`}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </FormModal>
        );
      }}
    </Formik>
  );
}
