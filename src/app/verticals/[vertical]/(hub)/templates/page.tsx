'use client';

import DescriptionOutlined from '@mui/icons-material/DescriptionOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Templates Library"
      icon={DescriptionOutlined}
      phase={4}
      spec="docs/super-admin/10-template-library.md"
    />
  );
}
