'use client';

import GavelOutlined from '@mui/icons-material/GavelOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="HR Policies"
      icon={GavelOutlined}
      phase={5}
      spec="docs/practice/08-hr-policies-and-settings.md"
    />
  );
}
