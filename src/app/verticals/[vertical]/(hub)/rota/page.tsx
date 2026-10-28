'use client';

import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="ROTA Management"
      icon={CalendarMonthOutlined}
      phase={4}
      spec="docs/super-admin/06-rota-management.md"
    />
  );
}
