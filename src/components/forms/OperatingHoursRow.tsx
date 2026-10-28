'use client';

import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import { TimeField } from '@mui/x-date-pickers/TimeField';
import Typography from '@mui/material/Typography';
import { AppSwitch } from './AppSwitch';

export interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

export interface OperatingHoursRowProps {
  dayKey: string;
  label: string;
  hours: DayHours;
  onChange: (hours: DayHours) => void;
  /** e.g. "Closing time must be after opening time". */
  error?: string;
  disabled?: boolean;
}

/**
 * One day: switch · Open/Closed · from HH:mm "to" to HH:mm (COMPONENTS.md → OperatingHoursRow).
 * Times are hidden while the day is closed, as live. Used by Operating Hours and Urgent Capacity.
 */
export function OperatingHoursRow({ dayKey, label, hours, onChange, error, disabled }: OperatingHoursRowProps) {
  // 24-hour HH:mm regardless of the browser's language, as in the live form.
  const timeField = (part: 'from' | 'to', aria: string) => (
    <TimeField
      value={hours[part] ? dayjs(`2000-01-01T${hours[part]}`) : null}
      onChange={(next) => onChange({ ...hours, [part]: next && next.isValid() ? next.format('HH:mm') : '' })}
      format="HH:mm"
      ampm={false}
      size="small"
      disabled={disabled}
      slotProps={{
        textField: { error: Boolean(error), slotProps: { input: { 'aria-label': `${label} ${aria}` } } },
      }}
      sx={{ width: 110 }}
    />
  );

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: { xs: 1, sm: 2 }, minHeight: 40 }}>
        <Typography id={`${dayKey}-label`} sx={{ width: 100, fontSize: 14, fontWeight: 500 }}>
          {label}
        </Typography>
        <AppSwitch
          checked={hours.open}
          onChange={(event) => onChange({ ...hours, open: event.target.checked })}
          disabled={disabled}
          slotProps={{ input: { 'aria-labelledby': `${dayKey}-label`, 'aria-label': `${label} open` } }}
        />
        <Typography sx={{ width: 56, fontSize: 14, color: hours.open ? 'text.primary' : 'text.secondary' }}>
          {hours.open ? 'Open' : 'Closed'}
        </Typography>
        {hours.open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {timeField('from', 'opening time')}
            <Typography sx={{ fontSize: 14, color: 'primary.main', fontWeight: 500 }}>to</Typography>
            {timeField('to', 'closing time')}
          </Box>
        )}
      </Box>
      {error && hours.open && (
        <Typography role="alert" sx={{ fontSize: 12, color: 'error.main', ml: { xs: 0, sm: '216px' }, mt: 0.5 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}
