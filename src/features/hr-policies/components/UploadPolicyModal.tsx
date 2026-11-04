'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import * as Yup from 'yup';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { FileDropzone } from '@/components/forms/FileDropzone';
import { FormModal } from '@/components/modals/FormModal';
import { DateField, fieldError } from '@/features/staff/staffForm';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import {
  formatFileSize,
  HR_DESCRIPTION_MAX,
  HR_POLICY_ACCEPT,
  HR_POLICY_CATEGORY_LABELS,
  HR_POLICY_FILE_MAX_BYTES,
  hrPoliciesApi,
} from '@/lib/api/hrPolicies';
import { ApiError } from '@/lib/api/http';
import { HR_POLICY_CATEGORIES, type HrPolicy, type HrPolicyCategory } from '@/lib/api/types';

interface Values {
  title: string;
  category: HrPolicyCategory | '';
  owner_id: string;
  effective_date: string;
  description: string;
  file_name: string;
  file_size: number;
}

const EMPTY: Values = {
  title: '',
  category: '',
  owner_id: '',
  effective_date: '',
  description: '',
  file_name: '',
  file_size: 0,
};

const schema = Yup.object({
  title: Yup.string().trim().required('Title is required').max(120, 'Title must be 120 characters or fewer'),
  category: Yup.string().required('Category is required'),
  description: Yup.string().max(HR_DESCRIPTION_MAX, `Description must be ${HR_DESCRIPTION_MAX} characters or fewer`),
  file_name: Yup.string().required('Add a PDF or Word (.docx) file'),
});

/**
 * Upload policy (docs/practice/08-hr-policies-and-settings.md §1, plan §7), and Replace with the
 * same form filled in and a new file required (the version goes up by one). Effective date is an MUI
 * date picker and Upload stays disabled until the form is valid (live: a native date input, and
 * Upload enabled while empty). Only the file name is kept in the demo.
 */
export function UploadPolicyModal({
  open,
  policy,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Set to replace this policy. */
  policy?: HrPolicy | null;
  onClose: () => void;
  onSaved: (policy: HrPolicy) => void;
}) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const [owners, setOwners] = useState<{ id: string; name: string; role_name: string }[]>([]);
  const replacing = Boolean(policy);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    hrPoliciesApi
      .owners(PUBLIC_SUB_APP_ID, practice.id, controller.signal)
      .then(setOwners)
      .catch(() => !controller.signal.aborted && enqueueSnackbar('Failed to load staff', { variant: 'error' }));
    return () => controller.abort();
  }, [open, practice.id, enqueueSnackbar]);

  const formik = useFormik<Values>({
    initialValues: policy
      ? {
          title: policy.title,
          category: policy.category,
          owner_id: policy.owner_id ?? '',
          effective_date: policy.effective_date ?? '',
          description: policy.description,
          // A replacement needs a new file.
          file_name: '',
          file_size: 0,
        }
      : EMPTY,
    enableReinitialize: true,
    validationSchema: schema,
    validateOnMount: true,
    onSubmit: async (values, helpers) => {
      const input = {
        title: values.title.trim(),
        category: values.category as HrPolicyCategory,
        owner_id: values.owner_id || null,
        effective_date: values.effective_date || null,
        description: values.description.trim(),
        file_name: values.file_name,
        file_size: values.file_size,
      };
      try {
        const saved = policy
          ? await hrPoliciesApi.replace(PUBLIC_SUB_APP_ID, practice.id, policy.id, input)
          : await hrPoliciesApi.create(PUBLIC_SUB_APP_ID, practice.id, input);
        enqueueSnackbar(policy ? 'Policy replaced.' : 'Policy uploaded.', { variant: 'success' });
        helpers.resetForm();
        onSaved(saved);
      } catch (error) {
        enqueueSnackbar(
          error instanceof ApiError && error.code === 400
            ? error.message
            : `We couldn't ${policy ? 'replace' : 'upload'} this policy.`,
          { variant: 'error' },
        );
      }
    },
  });
  const { values } = formik;

  const close = () => {
    formik.resetForm();
    onClose();
  };

  return (
    <FormModal
      open={open}
      title={replacing ? 'Replace Policy' : 'Upload Policy'}
      subtitle={
        replacing
          ? `Upload a new version of "${policy?.title}". The assistant answers from the new file once it is ready.`
          : 'Add a PDF or Word document. The assistant can answer from it once it is ready.'
      }
      onClose={close}
      onSubmit={() => void formik.submitForm()}
      submitLabel={replacing ? 'Replace' : 'Upload'}
      submitIcon={<CloudUploadOutlined />}
      submitDisabled={!formik.isValid}
      submitting={formik.isSubmitting}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            required
            label="Title"
            {...formik.getFieldProps('title')}
            error={Boolean(fieldError(formik, 'title'))}
            helperText={fieldError(formik, 'title')}
            slotProps={{ htmlInput: { maxLength: 120 } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            required
            label="Category"
            {...formik.getFieldProps('category')}
            error={Boolean(fieldError(formik, 'category'))}
            helperText={fieldError(formik, 'category')}
          >
            {HR_POLICY_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {HR_POLICY_CATEGORY_LABELS[category]}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label="Owner"
            {...formik.getFieldProps('owner_id')}
            helperText="Keeps this policy up to date."
          >
            <MenuItem value="">
              <em>No owner</em>
            </MenuItem>
            {owners.map((owner) => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.name} · {owner.role_name}
              </MenuItem>
            ))}
            {/* The saved owner, until the staff list arrives. */}
            {values.owner_id && !owners.some((owner) => owner.id === values.owner_id) && (
              <MenuItem value={values.owner_id} sx={{ display: 'none' }}>
                {policy?.owner_name ?? ''}
              </MenuItem>
            )}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DateField formik={formik} name="effective_date" label="Effective Date" />
        </Grid>
        <Grid size={12}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Description"
            {...formik.getFieldProps('description')}
            error={Boolean(fieldError(formik, 'description'))}
            helperText={fieldError(formik, 'description') ?? `${values.description.length}/${HR_DESCRIPTION_MAX}`}
            slotProps={{ htmlInput: { maxLength: HR_DESCRIPTION_MAX } }}
          />
        </Grid>
        <Grid size={12}>
          <FileDropzone
            accept={HR_POLICY_ACCEPT}
            maxSize={HR_POLICY_FILE_MAX_BYTES}
            label="Drop a file here or"
            helperText="PDF or Word (.docx), max 10 MB"
            typeError="Upload a PDF or Word (.docx) file."
            sizeError="The file must be 10 MB or smaller."
            fileName={values.file_name ? `${values.file_name} (${formatFileSize(values.file_size)})` : null}
            onClear={() => {
              void formik.setFieldValue('file_name', '');
              void formik.setFieldValue('file_size', 0);
            }}
            onFile={async (file) => {
              await formik.setFieldValue('file_size', file.size, false);
              await formik.setFieldValue('file_name', file.name);
            }}
          />
        </Grid>
      </Grid>
    </FormModal>
  );
}
