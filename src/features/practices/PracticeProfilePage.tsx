'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Formik, useFormikContext } from 'formik';
import { useSnackbar } from 'notistack';
import Stack from '@mui/material/Stack';
import { AccessDenied } from '@/components/feedback/AccessDenied';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { LogoUploadDropzone } from '@/components/forms/LogoUploadDropzone';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { fieldErrors, practiceManagementApi } from '@/lib/api/practiceManagement';
import type { Practice, Role } from '@/lib/api/types';
import { usersApi } from '@/lib/api/users';
import { AdditionalConfigurationSections } from './AdditionalConfigurationSections';
import { PracticeDetailsSections } from './PracticeDetailsSections';
import { PRACTICE_LIST_HREF, PracticeFormFrame } from './PracticeFormFrame';
import { focusFirstError, useNameAvailability } from './formHelpers';
import { profileFromApi, profileSchema, profileToApi, type ProfileValues } from './practiceForm';

type Loaded = {
  practice: Practice;
  values: ProfileValues;
  roles: Role[];
  practiceOptions: { id: string; practice_name: string }[];
};

/** Every practice the user can see (the API caps pages at 100), for the Linked Practices picker. */
async function allPractices(signal: AbortSignal) {
  const all: Practice[] = [];
  for (let page = 1; ; page++) {
    const result = await practiceManagementApi.practices(PUBLIC_SUB_APP_ID, { page, page_size: 100 }, signal);
    all.push(...result.results);
    if (!result.next) return all;
  }
}

function ProfileBody({ loaded }: { loaded: Loaded }) {
  const { values, setFieldValue } = useFormikContext<ProfileValues>();
  // A taken name is shown on the field; the server also rejects it on save.
  const nameStatus = useNameAvailability(values.practice_name, loaded.practice.id, loaded.practice.practice_name);

  return (
    <Stack spacing={2.5}>
      <LogoUploadDropzone
        value={values.logo_url}
        practiceName={values.practice_name}
        onUpload={async (file) => (await practiceManagementApi.uploadLogo(PUBLIC_SUB_APP_ID, file)).logo_url}
        onChange={(url) => setFieldValue('logo_url', url)}
      />
      <PracticeDetailsSections mode="profile" nameStatus={nameStatus} defaultExpanded={false} />
      <AdditionalConfigurationSections
        subAppId={PUBLIC_SUB_APP_ID}
        currentPracticeId={loaded.practice.id}
        practiceOptions={loaded.practiceOptions}
        roles={loaded.roles}
      />
    </Stack>
  );
}

/**
 * Practice View / Complete Practice Profile (docs/super-admin/04-practice-profile.md). Opened from
 * 👁 in Practice Management and after onboarding. One Save Changes saves the practice, its
 * appointment configuration and its SLA configuration.
 */
export function PracticeProfilePage() {
  const searchParams = useSearchParams();
  const practiceId = searchParams.get('practiceId') ?? '';
  const subAppId = searchParams.get('subAppId') ?? PUBLIC_SUB_APP_ID;
  const { enqueueSnackbar } = useSnackbar();
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'ready'; loaded: Loaded }>(
    { status: 'loading' },
  );

  useEffect(() => {
    if (!practiceId) return;
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      practiceManagementApi.practice(subAppId, practiceId, signal),
      practiceManagementApi.appointmentConfiguration(subAppId, practiceId, signal),
      practiceManagementApi.slaConfiguration(subAppId, practiceId, signal),
      usersApi.roles(subAppId, { page_size: 100 }, signal),
      allPractices(signal),
    ])
      .then(([practice, appointment, sla, roles, practices]) => {
        // The live page also fires this lookup on load; its result isn't shown on screen.
        void practiceManagementApi.sameRotaPractices(subAppId, practiceId).catch(() => undefined);
        setState({
          status: 'ready',
          loaded: {
            practice,
            values: profileFromApi(practice, appointment, sla),
            roles: roles.results,
            practiceOptions: practices.map(({ id, practice_name }) => ({ id, practice_name })),
          },
        });
      })
      .catch(() => {
        if (!signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [practiceId, subAppId]);

  const crumbs = [{ label: 'Practice Management', href: PRACTICE_LIST_HREF }, { label: 'Complete Practice Profile' }];

  if (!practiceId || state.status === 'error') {
    return (
      <HubManagementLayout hubManagementBreadcrumbs={crumbs}>
        <AccessDenied
          title="Practice not found or you don't have access"
          message="Check the link, or open the practice from Practice Management."
          backHref={PRACTICE_LIST_HREF}
          backLabel="Go to Practice Management"
        />
      </HubManagementLayout>
    );
  }
  if (state.status === 'loading') {
    return (
      <HubManagementLayout hubManagementBreadcrumbs={crumbs}>
        <LoadingSpinner message="Loading practice profile..." />
      </HubManagementLayout>
    );
  }

  const { loaded } = state;
  return (
    <Formik<ProfileValues>
      initialValues={loaded.values}
      validationSchema={profileSchema}
      validateOnBlur
      enableReinitialize
      onSubmit={async (values, helpers) => {
        const { input, appointment, sla } = profileToApi(values);
        const results = await Promise.allSettled([
          practiceManagementApi.updatePractice(subAppId, loaded.practice.id, input),
          practiceManagementApi.saveAppointmentConfiguration(subAppId, loaded.practice.id, appointment),
          practiceManagementApi.saveSlaConfiguration(subAppId, loaded.practice.id, sla),
        ]);
        const failed = ['practice details', 'appointment configuration', 'urgent capacity settings'].filter(
          (_, index) => results[index].status === 'rejected',
        );
        if (failed.length === 0) {
          enqueueSnackbar('Practice profile updated successfully', { variant: 'success' });
          helpers.resetForm({ values });
          return;
        }
        const first = results.find((result) => result.status === 'rejected');
        const errors = first?.status === 'rejected' ? fieldErrors(first.reason) : {};
        if (Object.keys(errors).length) {
          helpers.setErrors(errors);
          focusFirstError();
        }
        enqueueSnackbar(`Failed to save ${failed.join(' and ')}`, { variant: 'error' });
      }}
    >
      <PracticeFormFrame
        crumbs={crumbs}
        subtitle="Update practice information, upload your logo, and configure additional settings."
      >
        <ProfileBody loaded={loaded} />
      </PracticeFormFrame>
    </Formik>
  );
}
