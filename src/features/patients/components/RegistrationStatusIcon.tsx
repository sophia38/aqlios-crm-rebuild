'use client';

import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import CancelOutlined from '@mui/icons-material/CancelOutlined';
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutlineOutlined';
import HelpOutline from '@mui/icons-material/HelpOutlineOutlined';
import ReportProblemOutlined from '@mui/icons-material/ReportProblemOutlined';
import { REGISTRATION_STATUS_LABELS } from '@/lib/api/patients';
import type { RegistrationStatus } from '@/lib/api/types';

/** The list's icon-only Status column, with the status as tooltip and accessible name (live: ✅ + tooltip). */
export function RegistrationStatusIcon({ status }: { status: RegistrationStatus }) {
  const theme = useTheme();
  const label = REGISTRATION_STATUS_LABELS[status];
  const { Icon, color } = {
    PATIENT_REGISTERED_AND_CARER_CORRECT: { Icon: CheckCircleOutline, color: theme.tokens.tone.success.main },
    PATIENT_REGISTERED_BUT_CARER_INCORRECT: { Icon: ReportProblemOutlined, color: theme.tokens.tone.warning.main },
    NOT_KNOWN: { Icon: HelpOutline, color: theme.tokens.neutral[500] },
    PATIENT_NOT_REGISTERED: { Icon: CancelOutlined, color: theme.tokens.tone.error.main },
  }[status];
  return (
    <Tooltip title={label} describeChild>
      <Icon titleAccess={label} tabIndex={0} sx={{ fontSize: 20, color, verticalAlign: 'middle' }} />
    </Tooltip>
  );
}
