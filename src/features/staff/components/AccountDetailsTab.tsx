'use client';

import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import * as Yup from 'yup';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Add from '@mui/icons-material/Add';
import Schedule from '@mui/icons-material/Schedule';
import { StatusChip } from '@/components/data/StatusChip';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { OperatingHoursRow } from '@/components/forms/OperatingHoursRow';
import { RepeatableItemCard } from '@/components/forms/RepeatableItemCard';
import { RotaGroupSelect } from '@/components/forms/RotaGroupSelect';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { DUTY_TYPE_LABELS } from '@/lib/api/rota';
import { LEAVING_REASONS, staffApi } from '@/lib/api/staff';
import type { DayKey, DutyType, StaffAccountDetails } from '@/lib/api/types';
import { anyError, DateField, fieldError, useSaveBinding, weeklyHours, type StaffTabProps } from '../staffForm';

const DAYS: { key: DayKey; label: string }[] = [
  { key: 'SUNDAY', label: 'Sunday' },
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
];

const PHONE = /^\+?[0-9 ]{10,16}$/;
const POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i;
const NI_NUMBER = /^[A-Z]{2} ?\d{2} ?\d{2} ?\d{2} ?[A-D]$/i;
const MAX_CONTACTS = 3;

const required = (label: string) => Yup.string().trim().required(`${label} is required`);

const schema = Yup.object({
  first_name: required('First Name').max(50, 'First Name must be 50 characters or fewer'),
  last_name: required('Last Name').max(50, 'Last Name must be 50 characters or fewer'),
  email: required('Email').email('Enter a valid email'),
  phone: required('Phone number').matches(PHONE, 'Enter a valid phone number'),
  date_of_birth: required('Date of Birth').test('adult', 'Staff must be 18 or older', (value) =>
    value ? dayjs().diff(dayjs(value), 'year') >= 18 : true,
  ),
  spoken_language: Yup.string().max(50),
  performers_list_number: required('National Performers List Number'),
  registration_number: required('Registration number'),
  ppa_id: required('PPA ID'),
  smartcard_status: required('Smartcard Status'),
  ni_number: Yup.string()
    .trim()
    .matches(NI_NUMBER, { message: 'Enter a valid National Insurance Number', excludeEmptyString: true }),
  dbs_status: required('DBS Certificate'),
  dbs_level: required('DBS Level'),
  address_line_1: required('Address Line 1'),
  city: required('City'),
  postcode: required('Postcode').matches(POSTCODE, 'Enter a valid postcode'),
  emergency_contacts: Yup.array().of(
    Yup.object({
      name: required('Name'),
      relationship: Yup.string().trim(),
      phone: required('Phone number').matches(PHONE, 'Enter a valid phone number'),
    }),
  ),
  contract_start: required('Start Date').test(
    'recent',
    'Cannot be earlier than 20 years from today',
    (value) => !value || !dayjs(value).isBefore(dayjs().subtract(20, 'year'), 'day'),
  ),
  contract_end: Yup.string().when('ongoing_sla', {
    is: false,
    then: (field) =>
      field.test('after', 'Must be greater than Start Date and a future date', function check(value) {
        if (!value) return true;
        const { contract_start: start } = this.parent as StaffAccountDetails;
        return dayjs(value).isAfter(dayjs(), 'day') && (!start || dayjs(value).isAfter(dayjs(start), 'day'));
      }),
  }),
  contract_type: required('Contract Type'),
  duty_types: Yup.array().when('contract_type', {
    is: 'LOCUM',
    then: (field) => field.min(1, 'Duty Types is required'),
  }),
  availability: Yup.object().test('hours', 'Each open day needs a start time before its end time', (value) =>
    Object.values((value ?? {}) as StaffAccountDetails['availability']).every(
      (day) => !day.open || (day.from && day.to && day.from < day.to),
    ),
  ),
  employment_end: Yup.string().test('after-start', 'End Date must be after the Start Date', function check(value) {
    const { employment_start: start } = this.parent as StaffAccountDetails;
    return !value || !start || dayjs(value).isAfter(dayjs(start), 'day');
  }),
});

const SECTIONS = {
  personal: ['first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'spoken_language'],
  registration: ['performers_list_number', 'registration_number', 'ppa_id', 'smartcard_status', 'smartcard_number'],
  background: ['ni_number', 'dbs_status', 'dbs_number', 'dbs_issue_date', 'dbs_level', 'dbs_update_service'],
  address: ['address_line_1', 'address_line_2', 'city', 'postcode'],
  contract: ['contract_start', 'contract_end', 'contract_type', 'duty_types'],
  employment: ['employment_start', 'employment_end', 'leaving_reason'],
};

/** Account Details (docs/practice/05-staff-onboarding.md §6): the captured cards and fields. */
export function AccountDetailsTab({ staff, onSaved, bind }: StaffTabProps) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const formik = useFormik<StaffAccountDetails>({
    initialValues: staff.account,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, helpers) => {
      try {
        const saved = await staffApi.update(PUBLIC_SUB_APP_ID, practice.id, staff.id, 'account', {
          ...values,
          contract_end: values.ongoing_sla ? '' : values.contract_end,
          duty_types: values.contract_type === 'LOCUM' ? values.duty_types : [],
        });
        helpers.resetForm({ values: saved.account });
        enqueueSnackbar('Staff details saved', { variant: 'success' });
        onSaved(saved);
      } catch {
        enqueueSnackbar('Failed to save staff details', { variant: 'error' });
      }
    },
  });
  useSaveBinding(formik, bind);

  const { values, setFieldValue } = formik;
  const text = (
    name: keyof StaffAccountDetails,
    label: string,
    options: { required?: boolean; helperText?: string } = {},
  ) => {
    const error = fieldError(formik, name);
    return (
      <TextField
        fullWidth
        label={label}
        required={options.required}
        {...formik.getFieldProps(name)}
        error={Boolean(error)}
        helperText={error ?? options.helperText}
      />
    );
  };
  const select = (
    name: keyof StaffAccountDetails,
    label: string,
    options: { value: string; label: string }[],
    isRequired = false,
  ) => {
    const error = fieldError(formik, name);
    return (
      <TextField
        select
        fullWidth
        label={label}
        required={isRequired}
        {...formik.getFieldProps(name)}
        error={Boolean(error)}
        helperText={error}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  };
  const verification = (value: string) => (
    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, ml: 1.75 }}>
      Verification Status: {value ? 'Pending verification' : 'Not Verified'}
    </Typography>
  );
  const hours = weeklyHours(values.availability);
  const contactErrors = values.emergency_contacts.map((_, index) =>
    anyError(formik, [`emergency_contacts.${index}.name`, `emergency_contacts.${index}.phone`]),
  );

  return (
    <Stack spacing={2.5}>
      <FormSectionCard title="Personal Details" hasError={anyError(formik, SECTIONS.personal)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{text('first_name', 'First Name', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('last_name', 'Last Name', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('email', 'Email', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('phone', 'Phone number', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateField formik={formik} name="date_of_birth" label="Date of Birth" required maxDate={dayjs()} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('spoken_language', 'Spoken Language')}</Grid>
        </Grid>
      </FormSectionCard>

      <FormSectionCard title="Professional Registration" hasError={anyError(formik, SECTIONS.registration)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {text('performers_list_number', 'National Performers List Number', { required: true })}
            {verification(values.performers_list_number)}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {text('registration_number', 'Registration number', { required: true })}
            {verification(values.registration_number)}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('ppa_id', 'PPA ID', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {select(
              'smartcard_status',
              'Smartcard Status',
              [
                { value: 'WAITING', label: 'Waiting for Smartcard' },
                { value: 'HAS_SMARTCARD', label: 'Already Have Smartcard' },
              ],
              true,
            )}
          </Grid>
          {values.smartcard_status === 'HAS_SMARTCARD' && (
            <Grid size={{ xs: 12, md: 6 }}>{text('smartcard_number', 'Smartcard Number')}</Grid>
          )}
        </Grid>
      </FormSectionCard>

      <FormSectionCard title="Background & Identity Verification" hasError={anyError(formik, SECTIONS.background)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{text('ni_number', 'National Insurance Number')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {select(
              'dbs_status',
              'DBS Certificate',
              [
                { value: 'WAITING', label: 'Waiting for DBS' },
                { value: 'HAS_DBS', label: 'Already Have DBS' },
              ],
              true,
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {text('dbs_number', 'DBS Certificate Number', {
              helperText: values.dbs_number
                ? undefined
                : 'This staff member has not added a DBS certificate number yet.',
            })}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateField formik={formik} name="dbs_issue_date" label="DBS Certificate Issue Date" maxDate={dayjs()} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {select(
              'dbs_level',
              'DBS Level',
              [
                { value: 'STANDARD', label: 'Standard' },
                { value: 'ENHANCED', label: 'Enhanced' },
              ],
              true,
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {select('dbs_update_service', 'DBS Update Service', [
              { value: 'YES', label: 'Yes' },
              { value: 'NO', label: 'No' },
            ])}
          </Grid>
        </Grid>
      </FormSectionCard>

      <FormSectionCard title="Address" hasError={anyError(formik, SECTIONS.address)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>{text('address_line_1', 'Address Line 1', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('address_line_2', 'Address Line 2')}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('city', 'City', { required: true })}</Grid>
          <Grid size={{ xs: 12, md: 6 }}>{text('postcode', 'Postcode', { required: true })}</Grid>
        </Grid>
      </FormSectionCard>

      <FormSectionCard title="Emergency Contact" hasError={contactErrors.some(Boolean)}>
        <Stack spacing={2}>
          {values.emergency_contacts.map((contact, index) => {
            const path = (field: string) => `emergency_contacts.${index}.${field}`;
            const error = (field: string) => fieldError(formik, path(field));
            return (
              <RepeatableItemCard
                key={index}
                title={`Person ${index + 1} (Optional)`}
                hasError={contactErrors[index]}
                onDelete={() =>
                  void setFieldValue(
                    'emergency_contacts',
                    values.emergency_contacts.filter((_, other) => other !== index),
                  )
                }
              >
                <Grid container spacing={2}>
                  {(['name', 'relationship', 'phone'] as const).map((field) => (
                    <Grid key={field} size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label={field === 'name' ? 'Name' : field === 'relationship' ? 'Relationship' : 'Phone number'}
                        required={field !== 'relationship'}
                        {...formik.getFieldProps(path(field))}
                        value={contact[field]}
                        error={Boolean(error(field))}
                        helperText={error(field)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </RepeatableItemCard>
            );
          })}
          <Box>
            <Button
              variant="outlined"
              startIcon={<Add />}
              disabled={values.emergency_contacts.length >= MAX_CONTACTS}
              onClick={() =>
                void setFieldValue('emergency_contacts', [
                  ...values.emergency_contacts,
                  { name: '', relationship: '', phone: '' },
                ])
              }
            >
              Add Emergency Contact
            </Button>
          </Box>
        </Stack>
      </FormSectionCard>

      <FormSectionCard title="Rota groups (Optional)">
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Select one or more rota groups to associate with.
        </Typography>
        <RotaGroupSelect
          subAppId={PUBLIC_SUB_APP_ID}
          value={values.rota_group_ids}
          onChange={(ids) => void setFieldValue('rota_group_ids', ids)}
        />
      </FormSectionCard>

      <FormSectionCard title="Contract Details" hasError={anyError(formik, SECTIONS.contract)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateField
              formik={formik}
              name="contract_start"
              label="Start Date"
              required
              minDate={dayjs().subtract(20, 'year')}
              helperText="Cannot be earlier than 20 years from today"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateField
              formik={formik}
              name="contract_end"
              label="End Date"
              disabled={values.ongoing_sla}
              helperText="Must be greater than Start Date and a future date"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.ongoing_sla}
                  onChange={(event) => void setFieldValue('ongoing_sla', event.target.checked)}
                />
              }
              label="On Going SLA"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            {select(
              'contract_type',
              'Contract Type',
              [
                { value: 'LOCUM', label: 'Locum Staff' },
                { value: 'SALARIED', label: 'Salaried Staff' },
              ],
              true,
            )}
          </Grid>
          {values.contract_type === 'LOCUM' && (
            <Grid size={12}>
              <Box
                sx={(theme) => ({
                  p: 2,
                  borderRadius: `${theme.tokens.radius.input}px`,
                  bgcolor: theme.tokens.neutral[100],
                })}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>Locum Staff</Typography>
                <TextField
                  select
                  fullWidth
                  required
                  label="Duty Types"
                  value={values.duty_types}
                  onChange={(event) => void setFieldValue('duty_types', event.target.value as unknown as DutyType[])}
                  onBlur={() => void formik.setFieldTouched('duty_types', true)}
                  error={Boolean(fieldError(formik, 'duty_types'))}
                  helperText={fieldError(formik, 'duty_types')}
                  slotProps={{
                    select: {
                      multiple: true,
                      renderValue: (selected) =>
                        (selected as DutyType[]).map((value) => DUTY_TYPE_LABELS[value]).join(', '),
                    },
                  }}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  {(Object.keys(DUTY_TYPE_LABELS) as DutyType[]).map((key) => (
                    <MenuItem key={key} value={key}>
                      <Checkbox size="small" checked={values.duty_types.includes(key)} />
                      <ListItemText primary={DUTY_TYPE_LABELS[key]} />
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Grid>
          )}
        </Grid>
      </FormSectionCard>

      <FormSectionCard
        title="Availability"
        hasError={Boolean(formik.submitCount && formik.errors.availability)}
        actions={
          <StatusChip
            status={`Weekly Hours: ${Math.round(hours * 100) / 100} hrs`}
            tone="primary"
            icon={<Schedule fontSize="inherit" />}
          />
        }
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Your work hours have been set by your practice administrator based on your role. Please note that break time
          is unpaid and does not count towards your paid working hours.
        </Alert>
        <Stack spacing={1}>
          {DAYS.map(({ key, label }) => (
            <OperatingHoursRow
              key={key}
              dayKey={`availability-${key}`}
              label={label}
              hours={values.availability[key]}
              onChange={(next) => void setFieldValue(`availability.${key}`, next)}
              error={
                formik.submitCount &&
                values.availability[key].open &&
                !(values.availability[key].from < values.availability[key].to)
                  ? 'Start time must be before end time'
                  : undefined
              }
            />
          ))}
        </Stack>
      </FormSectionCard>

      <FormSectionCard title="Employment Record" hasError={anyError(formik, SECTIONS.employment)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateField formik={formik} name="employment_start" label="Start Date" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <DateField formik={formik} name="employment_end" label="End Date" />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Leaving Reason"
              {...formik.getFieldProps('leaving_reason')}
              helperText="Used for HR Analytics headcount and turnover."
            >
              <MenuItem value="">None</MenuItem>
              {LEAVING_REASONS.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </FormSectionCard>
    </Stack>
  );
}
