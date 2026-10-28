'use client';

import { FieldArray, getIn, useFormikContext } from 'formik';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import AddCircleOutline from '@mui/icons-material/AddCircleOutlineOutlined';
import ApartmentOutlined from '@mui/icons-material/ApartmentOutlined';
import ContactPhoneOutlined from '@mui/icons-material/ContactPhoneOutlined';
import LocationOnOutlined from '@mui/icons-material/LocationOnOutlined';
import PersonOutline from '@mui/icons-material/PersonOutlineOutlined';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { OdsPracticeSearch } from '@/components/forms/OdsPracticeSearch';
import { OperatingHoursRow } from '@/components/forms/OperatingHoursRow';
import { PhoneField } from '@/components/forms/PhoneField';
import { PracticeManagerSelect } from '@/components/forms/PracticeManagerSelect';
import { RepeatableItemCard } from '@/components/forms/RepeatableItemCard';
import { DAYS, EMPTY_POC, odsAutofill, type PracticeDetailsValues } from './practiceForm';
import { NAME_TAKEN_MESSAGE, useFieldError, useSectionErrors, useTextField, type NameStatus } from './formHelpers';

const DESCRIPTION_MAX = 500;

function Counter({ value }: { value: string }) {
  return (
    <Box component="span" sx={{ display: 'block', textAlign: 'right' }}>
      {value.length}/{DESCRIPTION_MAX} characters
    </Box>
  );
}

/** Grey multiline description field with a "0/500 characters" counter, as live. */
function DescriptionField({ path, label, placeholder }: { path: string; label: string; placeholder: string }) {
  const field = useTextField()(path);
  return (
    <TextField
      {...field}
      label={label}
      placeholder={placeholder}
      multiline
      minRows={4}
      slotProps={{ inputLabel: { shrink: true }, htmlInput: { maxLength: DESCRIPTION_MAX } }}
      helperText={field.helperText ?? <Counter value={field.value} />}
      sx={(theme) => ({ '& .MuiOutlinedInput-root': { bgcolor: theme.tokens.control.textareaFill } })}
    />
  );
}

export interface PracticeDetailsSectionsProps {
  mode: 'onboard' | 'profile';
  nameStatus: NameStatus;
  /** Sections start collapsed on the profile, expanded on onboarding (live). */
  defaultExpanded: boolean;
}

/**
 * The four practice-detail sections shared by Onboard New Practice and the profile
 * (approved new component `PracticeForm`, docs/plans/phase-3-reference-screens.md).
 */
export function PracticeDetailsSections({ mode, nameStatus, defaultExpanded }: PracticeDetailsSectionsProps) {
  const formik = useFormikContext<PracticeDetailsValues>();
  const { values, setFieldValue, setFieldTouched, setValues } = formik;
  const text = useTextField();
  const errorOf = useFieldError();
  const sectionErrors = useSectionErrors();
  const submitted = formik.submitCount > 0;
  // A section holding an error after submit is forced open so the error is visible.
  const open = (key: Parameters<typeof sectionErrors.has>[0]) =>
    submitted && sectionErrors.has(key) ? true : undefined;

  const shrink = { inputLabel: { shrink: true } };
  const nameField = text('practice_name');
  const nameError = nameField.helperText ?? (nameStatus === 'taken' ? NAME_TAKEN_MESSAGE : undefined);

  return (
    <Stack spacing={2.5}>
      <FormSectionCard
        title="Practice Details"
        icon={<ApartmentOutlined />}
        hasError={sectionErrors.has('details') || nameStatus === 'taken'}
        defaultExpanded={defaultExpanded}
        expanded={open('details')}
      >
        <Grid container spacing={2.5}>
          {mode === 'onboard' && (
            <Grid size={12}>
              <OdsPracticeSearch
                value={values.ods_selection}
                inputValue={values.ods_query}
                onInputValueChange={(value) => setFieldValue('ods_query', value)}
                onSelect={(entry) => {
                  if (entry) void setValues({ ...values, ...odsAutofill(entry) }, true);
                  else void setFieldValue('ods_selection', null);
                }}
                onBlur={() => setFieldTouched('ods_query', true)}
                error={Boolean(errorOf('ods_query'))}
                helperText={errorOf('ods_query')}
              />
            </Grid>
          )}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...nameField}
              label="Practice Name"
              required
              placeholder="Enter practice name (must be unique)"
              error={Boolean(nameError)}
              helperText={nameError ?? (nameStatus === 'checking' ? 'Checking name…' : undefined)}
              slotProps={shrink}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PracticeManagerSelect
              value={values.practice_manager}
              initialLabel={values.practice_manager_name}
              onChange={(id) => setFieldValue('practice_manager', id)}
            />
          </Grid>
          <Grid size={12}>
            <TextField select label="Practice Type" required value="PUBLIC" disabled slotProps={shrink}>
              <MenuItem value="PUBLIC">Public</MenuItem>
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField {...text('pcn_name')} label="PCN Name" required placeholder="PCN Name" slotProps={shrink} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <PhoneField
              name="phone_number"
              label="Phone number"
              required
              value={values.phone_number}
              onChange={(value) => setFieldValue('phone_number', value)}
              onBlur={() => setFieldTouched('phone_number', true)}
              error={Boolean(errorOf('phone_number'))}
              helperText={errorOf('phone_number')}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...text('email_address')}
              type="email"
              label="Email Address"
              placeholder="Email Address"
              slotProps={shrink}
            />
          </Grid>
          <Grid size={12}>
            <TextField {...text('website')} label="Website" placeholder="test.co.uk" slotProps={shrink} />
          </Grid>
          <Grid size={12}>
            <DescriptionField
              path="description"
              label="Practice Description"
              placeholder="Brief description of your practice and services..."
            />
          </Grid>
        </Grid>
      </FormSectionCard>

      <FormSectionCard
        title="Address"
        icon={<LocationOnOutlined />}
        hasError={sectionErrors.has('address')}
        defaultExpanded={defaultExpanded}
        expanded={open('address')}
      >
        <Grid container spacing={2.5}>
          <Grid size={12}>
            <TextField
              {...text('address_line_1')}
              label="Address Line 1"
              required
              placeholder="Enter Address Line 1"
              slotProps={shrink}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              {...text('address_line_2')}
              label="Address Line 2"
              placeholder="Enter Address Line 2 (optional)"
              slotProps={shrink}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...text('postcode')}
              label="Postcode"
              required
              placeholder="Enter Postcode (e.g., SW1A 2HQ)"
              slotProps={shrink}
            />
          </Grid>
        </Grid>
      </FormSectionCard>

      <FieldArray name="points_of_contact">
        {(helpers) => (
          <FormSectionCard
            title="Point of contact"
            icon={<ContactPhoneOutlined />}
            hasError={sectionErrors.has('contacts')}
            defaultExpanded={defaultExpanded}
            expanded={open('contacts')}
            actions={
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddCircleOutline />}
                onClick={() => helpers.push({ ...EMPTY_POC })}
                sx={(theme) => ({
                  borderRadius: `${theme.tokens.radius.pill}px`,
                  display: { xs: 'none', sm: 'inline-flex' },
                })}
              >
                Add Another POC
              </Button>
            }
          >
            <Stack spacing={2}>
              {values.points_of_contact.length === 0 && (
                <Box sx={{ color: 'text.secondary', fontSize: 14 }}>No contacts added yet.</Box>
              )}
              {values.points_of_contact.map((poc, index) => {
                const path = `points_of_contact.${index}`;
                return (
                  <RepeatableItemCard
                    key={index}
                    title={`Person ${index + 1}`}
                    icon={<PersonOutline fontSize="small" />}
                    onDelete={() => helpers.remove(index)}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField {...text(`${path}.name`)} label="Name" required slotProps={shrink} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <PhoneField
                          name={`${path}.phone_number`}
                          label="Contact No"
                          required
                          value={poc.phone_number}
                          onChange={(value) => setFieldValue(`${path}.phone_number`, value)}
                          onBlur={() => setFieldTouched(`${path}.phone_number`, true)}
                          error={Boolean(errorOf(`${path}.phone_number`))}
                          helperText={errorOf(`${path}.phone_number`)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField {...text(`${path}.email`)} type="email" label="Email" required slotProps={shrink} />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField {...text(`${path}.designation`)} label="Designation" required slotProps={shrink} />
                      </Grid>
                      <Grid size={12}>
                        <DescriptionField
                          path={`${path}.description`}
                          label="Description"
                          placeholder="Notes about this contact (optional)"
                        />
                      </Grid>
                    </Grid>
                  </RepeatableItemCard>
                );
              })}
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddCircleOutline />}
                onClick={() => helpers.push({ ...EMPTY_POC })}
                sx={(theme) => ({
                  alignSelf: 'flex-start',
                  borderRadius: `${theme.tokens.radius.pill}px`,
                  display: { xs: 'inline-flex', sm: 'none' },
                })}
              >
                Add Another POC
              </Button>
            </Stack>
          </FormSectionCard>
        )}
      </FieldArray>

      <FormSectionCard
        title="Operating Hours"
        icon={<AccessTimeOutlined />}
        hasError={sectionErrors.has('hours')}
        defaultExpanded={defaultExpanded}
        expanded={open('hours')}
      >
        {DAYS.map(({ key, label }) => (
          <OperatingHoursRow
            key={key}
            dayKey={`hours-${key}`}
            label={label}
            hours={values.hours[key]}
            onChange={(hours) => setFieldValue(`hours.${key}`, hours)}
            // Time-order errors show as soon as the times change (no blur on these fields).
            error={getIn(formik.errors, `hours.${key}`) as string | undefined}
          />
        ))}
      </FormSectionCard>
    </Stack>
  );
}
