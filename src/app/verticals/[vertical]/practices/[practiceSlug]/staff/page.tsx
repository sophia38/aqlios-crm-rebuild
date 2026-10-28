'use client';

import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Staff Management"
      icon={PersonAddAltOutlined}
      phase={5}
      spec="docs/practice/05-staff-onboarding.md"
    />
  );
}
