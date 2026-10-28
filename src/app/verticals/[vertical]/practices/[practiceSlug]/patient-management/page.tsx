'use client';

import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Patient Management"
      icon={AssignmentIndOutlined}
      phase={5}
      spec="docs/practice/01-patients.md"
    />
  );
}
