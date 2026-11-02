'use client';

import { useRef } from 'react';
import { Formik, useFormikContext } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import { StatusChip } from '@/components/data/StatusChip';
import { RichTextEditor } from '@/components/forms/RichTextEditor';
import { FormModal } from '@/components/modals/FormModal';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { TEMPLATE_PLACEHOLDERS, templatesApi, templateText } from '@/lib/api/templates';
import {
  TEMPLATE_CATEGORIES,
  type CommunicationTemplate,
  type TemplateInput,
  type TemplateStatus,
  type TemplateType,
} from '@/lib/api/types';
import { MessagePreview } from './components/MessagePreview';
import { PREVIEW_PRACTICE, STATUS_LABEL, TYPE_LABEL } from './templateLabels';

export type TemplateDialogMode = 'create' | 'view' | 'edit';

const MESSAGE_MAX = 300;

interface Values {
  name: string;
  category: string;
  type: TemplateType;
  status: TemplateStatus;
  subject: string;
  body: string;
  bodyText: string;
}

const schema = Yup.object({
  name: Yup.string().trim().required('Template name is required'),
  category: Yup.string().required('Category is required'),
  subject: Yup.string().when('type', {
    is: 'EMAIL',
    then: (field) => field.trim().required('Subject is required'),
  }),
  bodyText: Yup.string()
    .trim()
    .required('Template message is required')
    .max(MESSAGE_MAX, `Template message must be ${MESSAGE_MAX} characters or fewer`),
});

const COPY: Record<TemplateDialogMode, { title: string; subtitle: string; card: string }> = {
  create: {
    title: 'Create Template',
    subtitle: 'Save reusable patient communication templates.',
    card: 'Create a reusable message template.',
  },
  view: {
    title: 'Template Details',
    subtitle: 'View reusable patient communication template.',
    card: 'The content of this reusable message template.',
  },
  edit: {
    title: 'Edit Template',
    subtitle: 'Update reusable patient communication templates.',
    card: 'Update this reusable message template.',
  },
};

function toValues(template?: CommunicationTemplate): Values {
  return {
    name: template?.name ?? '',
    category: template?.category ?? '',
    type: template?.type ?? 'MESSAGE',
    status: template?.status ?? 'DRAFT',
    subject: template?.subject ?? '',
    body: template?.body ?? '',
    bodyText: template ? templateText(template.body) : '',
  };
}

function toInput(values: Values, status: TemplateStatus): TemplateInput {
  return {
    name: values.name.trim(),
    category: values.category as TemplateInput['category'],
    type: values.type,
    status,
    subject: values.type === 'EMAIL' ? values.subject.trim() : null,
    body: values.body,
  };
}

/**
 * Create Template / Template Details / Edit Template popup (docs/super-admin/10-template-library.md),
 * built on the extra-large FormModal with the captured sticky footer.
 */
export function TemplateFormDialog({
  open,
  mode,
  template,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: TemplateDialogMode;
  template?: CommunicationTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const asDraft = useRef(false);

  const submit = async (values: Values) => {
    const status = asDraft.current ? 'DRAFT' : values.status;
    try {
      if (mode === 'edit' && template) {
        await templatesApi.update(PUBLIC_SUB_APP_ID, template.id, toInput(values, status));
        enqueueSnackbar(asDraft.current ? 'Template saved as draft' : 'Template updated successfully', {
          variant: 'success',
        });
      } else {
        await templatesApi.create(PUBLIC_SUB_APP_ID, toInput(values, status));
        enqueueSnackbar(asDraft.current ? 'Template saved as draft' : 'Template created successfully', {
          variant: 'success',
        });
      }
      onSaved();
    } catch {
      enqueueSnackbar('Failed to save template', { variant: 'error' });
    }
  };

  return (
    <Formik
      key={`${open}-${mode}-${template?.id ?? 'new'}`}
      initialValues={toValues(template)}
      validationSchema={schema}
      validateOnMount
      onSubmit={submit}
    >
      <TemplateFormBody
        open={open}
        mode={mode}
        scopeLabel={template?.scope === 'STAFF' ? 'Staff Created Template' : 'Standard Template'}
        onClose={onClose}
        onDraft={() => {
          asDraft.current = true;
        }}
        onSave={() => {
          asDraft.current = false;
        }}
      />
    </Formik>
  );
}

function TemplateFormBody({
  open,
  mode,
  scopeLabel,
  onClose,
  onDraft,
  onSave,
}: {
  open: boolean;
  mode: TemplateDialogMode;
  scopeLabel: string;
  onClose: () => void;
  onDraft: () => void;
  onSave: () => void;
}) {
  const formik = useFormikContext<Values>();
  const readOnly = mode === 'view';
  const copy = COPY[mode];
  const shown = (field: keyof Values) => formik.submitCount > 0 || Boolean(formik.touched[field]);
  const errorOf = (field: keyof Values) => (shown(field) ? formik.errors[field] : undefined);

  const text = (field: 'name' | 'subject', label: string, placeholder: string) => (
    <TextField
      id={field}
      name={field}
      label={label}
      required
      placeholder={placeholder}
      value={formik.values[field]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      disabled={readOnly}
      error={Boolean(errorOf(field))}
      helperText={errorOf(field)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );

  const footer = readOnly ? (
    <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
      <Button
        variant="outlined"
        onClick={onClose}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
      >
        Close
      </Button>
    </Stack>
  ) : (
    <Stack direction={{ xs: 'column-reverse', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
      <Button
        variant="outlined"
        onClick={onClose}
        disabled={formik.isSubmitting}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
      >
        Cancel
      </Button>
      <Box sx={{ flex: 1 }} />
      <Button
        type="submit"
        variant="outlined"
        onClick={onDraft}
        disabled={formik.isSubmitting}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
      >
        Save as Draft
      </Button>
      <Button
        type="submit"
        variant="contained"
        color="brand"
        onClick={onSave}
        disabled={!formik.isValid || formik.isSubmitting}
        loading={formik.isSubmitting}
        sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, px: 3 })}
      >
        {mode === 'edit' ? 'Save Changes' : 'Create Template'}
      </Button>
    </Stack>
  );

  const card = (title: string, subtitle: string, children: React.ReactNode, action?: React.ReactNode) => (
    <Box
      component="section"
      sx={(theme) => ({
        height: '100%',
        p: { xs: 2, md: 2.5 },
        border: `1px solid ${theme.tokens.border.medium}`,
        borderRadius: `${theme.tokens.radius.base}px`,
      })}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography component="h3" sx={{ fontSize: 16, fontWeight: 600, color: 'text.primary' }}>
            {title}
          </Typography>
          <Typography variant="body2">{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
      {children}
    </Box>
  );

  return (
    <FormModal
      open={open}
      size="xl"
      icon={<DescriptionOutlined />}
      title={copy.title}
      titleAdornment={<StatusChip status={scopeLabel} tone="primary" />}
      subtitle={copy.subtitle}
      onClose={onClose}
      onSubmit={() => formik.handleSubmit()}
      submitLabel={copy.title}
      submitting={formik.isSubmitting}
      footer={footer}
    >
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          {card(
            'Template Details',
            copy.card,
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>{text('name', 'Template Name', 'e.g. Appointment Reminder')}</Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    id="category"
                    name="category"
                    label="Category"
                    required
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={readOnly}
                    error={Boolean(errorOf('category'))}
                    helperText={errorOf('category')}
                    slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
                  >
                    <MenuItem value="" disabled>
                      Select category
                    </MenuItem>
                    {TEMPLATE_CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <FormControl disabled={readOnly}>
                <FormLabel id="template-type-label" required sx={{ fontSize: 14, mb: 0.5 }}>
                  Template Type
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="template-type-label"
                  name="type"
                  value={formik.values.type}
                  onChange={(event) => formik.setFieldValue('type', event.target.value)}
                >
                  <FormControlLabel value="MESSAGE" control={<Radio size="small" />} label="Message (SMS / In-app)" />
                  <FormControlLabel value="EMAIL" control={<Radio size="small" />} label={TYPE_LABEL.EMAIL} />
                  <FormControlLabel value="NOTE" control={<Radio size="small" />} label={TYPE_LABEL.NOTE} />
                </RadioGroup>
              </FormControl>
              {formik.values.type === 'EMAIL' &&
                text('subject', 'Subject', 'e.g. Your appointment at {{practice_name}}')}
              <RichTextEditor
                id="body"
                label="Template Message"
                required
                value={formik.values.body}
                onChange={(html, plain) => {
                  formik.setFieldValue('body', html);
                  formik.setFieldValue('bodyText', plain);
                }}
                onBlur={() => formik.setFieldTouched('bodyText', true)}
                placeholder="Write your template message..."
                placeholders={TEMPLATE_PLACEHOLDERS}
                maxLength={MESSAGE_MAX}
                readOnly={readOnly}
                error={Boolean(errorOf('bodyText'))}
                helperText={errorOf('bodyText')}
              />
            </Stack>,
            <TextField
              select
              size="small"
              label="Status"
              value={formik.values.status}
              onChange={(event) => formik.setFieldValue('status', event.target.value)}
              disabled={readOnly}
              fullWidth={false}
              sx={(theme) => ({
                minWidth: 130,
                '& .MuiOutlinedInput-root': { borderRadius: `${theme.tokens.radius.pill}px` },
              })}
            >
              {(['ACTIVE', 'INACTIVE', 'DRAFT'] as const).map((status) => (
                <MenuItem key={status} value={status}>
                  {STATUS_LABEL[status]}
                </MenuItem>
              ))}
            </TextField>,
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          {card(
            'Preview',
            'See how your template will appear with sample data.',
            <MessagePreview
              practiceName={PREVIEW_PRACTICE}
              body={formik.values.bodyText}
              subject={formik.values.type === 'EMAIL' ? formik.values.subject : null}
            />,
          )}
        </Grid>
      </Grid>
    </FormModal>
  );
}
