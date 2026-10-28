'use client';

import LockOutlined from '@mui/icons-material/LockOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Roles & Permissions"
      subtitle="Roles List"
      icon={LockOutlined}
      phase={4}
      spec="docs/super-admin/05-roles-and-permissions.md"
    />
  );
}
