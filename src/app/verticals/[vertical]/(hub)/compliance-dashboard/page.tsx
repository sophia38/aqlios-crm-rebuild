'use client';

import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="CQC Compliance"
      icon={VerifiedOutlined}
      phase={4}
      spec="docs/super-admin/08-cqc-compliance.md"
    />
  );
}
