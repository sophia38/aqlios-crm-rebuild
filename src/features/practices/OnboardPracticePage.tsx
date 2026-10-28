'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Formik, useFormikContext } from 'formik';
import { useSnackbar } from 'notistack';
import Stack from '@mui/material/Stack';
import { LogoUploadDropzone } from '@/components/forms/LogoUploadDropzone';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { fieldErrors, practiceManagementApi } from '@/lib/api/practiceManagement';
import { PracticeDetailsSections } from './PracticeDetailsSections';
import { PRACTICE_LIST_HREF, PracticeFormFrame } from './PracticeFormFrame';
import { focusFirstError, useNameAvailability, type NameStatus } from './formHelpers';
import { detailsToInput, EMPTY_DETAILS, onboardSchema, type PracticeDetailsValues } from './practiceForm';

export const PROFILE_PATH = `${PRACTICE_LIST_HREF}/practice-management/create/manual/complete-profile`;

export function profileHref(practiceId: string) {
  return `${PROFILE_PATH}?practiceId=${practiceId}&subAppId=${PUBLIC_SUB_APP_ID}`;
}

function OnboardBody({ nameStatusRef }: { nameStatusRef: RefObject<NameStatus> }) {
  const { values, setFieldValue } = useFormikContext<PracticeDetailsValues>();
  const nameStatus = useNameAvailability(values.practice_name);
  // Shared with the submit handler, which lives outside this component.
  useEffect(() => {
    nameStatusRef.current = nameStatus;
  }, [nameStatus, nameStatusRef]);
  return (
    <Stack spacing={2.5}>
      <LogoUploadDropzone
        value={values.logo_url}
        practiceName={values.practice_name}
        onUpload={async (file) => (await practiceManagementApi.uploadLogo(PUBLIC_SUB_APP_ID, file)).logo_url}
        onChange={(url) => setFieldValue('logo_url', url)}
      />
      <PracticeDetailsSections mode="onboard" nameStatus={nameStatus} defaultExpanded />
    </Stack>
  );
}

/** Onboard New Practice (reference screen for create forms; docs/super-admin/03-onboard-new-practice.md). */
export function OnboardPracticePage() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const nameStatusRef = useRef<NameStatus>('idle');

  return (
    <Formik<PracticeDetailsValues>
      initialValues={EMPTY_DETAILS}
      validationSchema={onboardSchema}
      validateOnBlur
      onSubmit={async (values, helpers) => {
        if (nameStatusRef.current === 'taken') {
          focusFirstError();
          return;
        }
        try {
          const practice = await practiceManagementApi.createPractice(PUBLIC_SUB_APP_ID, detailsToInput(values));
          enqueueSnackbar('Practice onboarded successfully', { variant: 'success' });
          // Approved: continue to the new practice's profile to finish the Additional Configuration.
          router.push(profileHref(practice.id));
        } catch (error) {
          const errors = fieldErrors(error);
          if (Object.keys(errors).length) {
            helpers.setErrors(errors);
            focusFirstError();
          }
          enqueueSnackbar('Failed to onboard practice', { variant: 'error' });
        }
      }}
    >
      <PracticeFormFrame
        crumbs={[{ label: 'Practice Management', href: PRACTICE_LIST_HREF }, { label: 'Add New Practice' }]}
        subtitle="Enter your practice information manually to onboard your practice."
      >
        <OnboardBody nameStatusRef={nameStatusRef} />
      </PracticeFormFrame>
    </Formik>
  );
}
