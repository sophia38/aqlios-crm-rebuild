'use client';

import PersonOutlineOutlined from '@mui/icons-material/PersonOutlineOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Staff Member Details"
      icon={PersonOutlineOutlined}
      phase={5}
      spec="docs/practice-user/00-practice-user-role.md"
    />
  );
}
