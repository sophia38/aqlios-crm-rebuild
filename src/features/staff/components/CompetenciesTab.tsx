'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Search from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { FormSectionCard } from '@/components/forms/FormSectionCard';
import { useCurrentPractice } from '@/features/practice/PracticeContext';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { settingsApi } from '@/lib/api/settings';
import { AGE_GROUPS, staffApi } from '@/lib/api/staff';
import { PRACTICE_STAFF_TYPES, type Competency, type StaffCompetencies } from '@/lib/api/types';
import { useSaveBinding, type StaffTabProps } from '../staffForm';
import { useRoles } from './InviteStaffModal';

type Item = StaffCompetencies['items'][number];

/**
 * Competencies (docs/practice/05-staff-onboarding.md §6): Consultation Details and the Competency
 * Mapping from Settings → Competency. Age groups don't overlap (phase 5 question 7). On your own
 * profile the Date Completed pickers are disabled, as captured.
 */
export function CompetenciesTab({ staff, self, onSaved, bind }: StaffTabProps) {
  const practice = useCurrentPractice();
  const { enqueueSnackbar } = useSnackbar();
  const roles = useRoles();
  const [competencies, setCompetencies] = useState<Competency[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    settingsApi
      .competencies(PUBLIC_SUB_APP_ID, { page_size: 100 }, controller.signal)
      .then((response) => setCompetencies(response.results))
      .catch(() => {
        if (controller.signal.aborted) return;
        setCompetencies([]);
        enqueueSnackbar('Failed to load competencies', { variant: 'error' });
      });
    return () => controller.abort();
  }, [enqueueSnackbar]);

  const formik = useFormik<StaffCompetencies>({
    initialValues: staff.competencies,
    enableReinitialize: true,
    onSubmit: async (values, helpers) => {
      try {
        const saved = await staffApi.update(PUBLIC_SUB_APP_ID, practice.id, staff.id, 'competencies', {
          ...values,
          // Only competencies with something set are kept.
          items: values.items.filter((item) => item.date_completed || item.sub_types.length),
        });
        helpers.resetForm({ values: saved.competencies });
        enqueueSnackbar('Staff details saved', { variant: 'success' });
        onSaved(saved);
      } catch {
        enqueueSnackbar('Failed to save competencies', { variant: 'error' });
      }
    },
  });
  useSaveBinding(formik, bind);

  const { values, setFieldValue } = formik;
  const itemFor = (id: string): Item =>
    values.items.find((item) => item.competency_id === id) ?? { competency_id: id, date_completed: '', sub_types: [] };
  const setItem = (next: Item) =>
    void setFieldValue('items', [...values.items.filter((item) => item.competency_id !== next.competency_id), next]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (competencies ?? []).filter(
      (item) =>
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.sub_types.some((sub) => sub.toLowerCase().includes(term)),
    );
  }, [competencies, search]);

  const allSubTypes = (competencies ?? []).reduce((total, item) => total + item.sub_types.length, 0);
  const checkedSubTypes = (competencies ?? []).reduce((total, item) => total + itemFor(item.id).sub_types.length, 0);
  const allChecked = allSubTypes > 0 && checkedSubTypes === allSubTypes;

  return (
    <Stack spacing={2.5}>
      <FormSectionCard title="Consultation Details">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Inbox" {...formik.getFieldProps('inbox')} disabled={roles === null}>
              {(roles ?? []).map((role) => (
                <MenuItem key={role.id} value={role.name}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Staff Type" {...formik.getFieldProps('staff_type')}>
              {PRACTICE_STAFF_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <FormLabel component="legend" sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary' }}>
              Age Groups
            </FormLabel>
            <Typography variant="caption" sx={{ display: 'block' }}>
              Which age groups the staff members can see
            </Typography>
            <FormGroup row>
              {AGE_GROUPS.map((group) => (
                <FormControlLabel
                  key={group}
                  label={group}
                  control={
                    <Checkbox
                      checked={values.age_groups.includes(group)}
                      onChange={(event) =>
                        void setFieldValue(
                          'age_groups',
                          event.target.checked
                            ? AGE_GROUPS.filter((item) => item === group || values.age_groups.includes(item))
                            : values.age_groups.filter((item) => item !== group),
                        )
                      }
                    />
                  }
                />
              ))}
            </FormGroup>
          </Grid>
        </Grid>
      </FormSectionCard>

      <FormSectionCard title="Competency Mapping">
        <Stack spacing={2}>
          <TextField
            size="small"
            label="Search"
            placeholder="Search competencies"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Alert severity="warning">
            Please ensure to discuss your competency mapping with your clinical leadership. The copy of the competency
            map will be sent to clinician, practice manager and clinical leadership team.
          </Alert>
          <FormControlLabel
            label="Select All"
            control={
              <Checkbox
                checked={allChecked}
                indeterminate={checkedSubTypes > 0 && !allChecked}
                disabled={!allSubTypes}
                onChange={(event) =>
                  void setFieldValue(
                    'items',
                    (competencies ?? []).map((competency) => ({
                      ...itemFor(competency.id),
                      sub_types: event.target.checked ? [...competency.sub_types] : [],
                    })),
                  )
                }
              />
            }
          />
          {competencies === null ? (
            <LoadingSpinner message="Loading competencies..." />
          ) : shown.length === 0 ? (
            <Typography variant="body2">
              {search ? 'No competencies found. Try another search.' : 'No competencies have been set up yet.'}
            </Typography>
          ) : (
            <Stack component="ul" spacing={1.5} sx={{ m: 0, p: 0 }}>
              {shown.map((competency) => {
                const item = itemFor(competency.id);
                return (
                  <Box
                    component="li"
                    key={competency.id}
                    aria-label={competency.name}
                    sx={(theme) => ({
                      listStyle: 'none',
                      p: 1.5,
                      borderRadius: `${theme.tokens.radius.input}px`,
                      border: `1px solid ${theme.tokens.border.medium}`,
                    })}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={1.5}
                      sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
                    >
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                          {competency.name} ({competency.sub_types.length}{' '}
                          {competency.sub_types.length === 1 ? 'Subtype' : 'Subtypes'})
                        </Typography>
                        <Typography variant="caption">Slot: {competency.slot_duration_minutes} min</Typography>
                      </Box>
                      <DatePicker
                        label="Date Completed"
                        value={item.date_completed ? dayjs(item.date_completed) : null}
                        format="DD/MM/YYYY"
                        maxDate={dayjs()}
                        disabled={self}
                        onChange={(next) =>
                          setItem({ ...item, date_completed: next && next.isValid() ? next.format('YYYY-MM-DD') : '' })
                        }
                        slotProps={{ textField: { size: 'small', sx: { width: 190 } }, field: { clearable: true } }}
                      />
                    </Stack>
                    {competency.sub_types.length > 0 && (
                      <FormGroup row sx={{ mt: 1 }}>
                        {competency.sub_types.map((sub) => (
                          <FormControlLabel
                            key={sub}
                            label={sub}
                            control={
                              <Checkbox
                                size="small"
                                checked={item.sub_types.includes(sub)}
                                onChange={(event) =>
                                  setItem({
                                    ...item,
                                    sub_types: event.target.checked
                                      ? [...item.sub_types, sub]
                                      : item.sub_types.filter((value) => value !== sub),
                                  })
                                }
                              />
                            }
                          />
                        ))}
                      </FormGroup>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </FormSectionCard>
    </Stack>
  );
}
