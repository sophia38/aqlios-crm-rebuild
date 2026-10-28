'use client';

import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Leave Management"
      icon={AccessTimeOutlined}
      phase={5}
      spec="docs/practice/07-leaves-and-leaves-rota.md"
    />
  );
}
