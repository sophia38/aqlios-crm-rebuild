'use client';

import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Practice Management"
      subtitle="Practice List"
      icon={PersonAddAltOutlined}
      phase={3}
      spec="docs/super-admin/02-practice-onboarding.md"
    />
  );
}
