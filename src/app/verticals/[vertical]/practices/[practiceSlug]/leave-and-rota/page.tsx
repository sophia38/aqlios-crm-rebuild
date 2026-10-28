'use client';

import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage
      title="Leaves and ROTA"
      icon={EventAvailableOutlined}
      phase={5}
      spec="docs/practice/07-leaves-and-leaves-rota.md"
    />
  );
}
