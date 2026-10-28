'use client';

import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import { InterimModulePage } from '@/features/shell/PlaceholderPages';

export default function Page() {
  return (
    <InterimModulePage title="Settings" icon={SettingsOutlined} phase={4} spec="docs/super-admin/09-settings.md" />
  );
}
