'use client';

import Box from '@mui/material/Box';
import type { SvgIconComponent } from '@mui/icons-material';
import { ComingSoonPlaceholder } from '@/components/feedback/ComingSoonPlaceholder';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';

// Page bodies for routes that aren't built yet. "coming soon" pages are final (the live app has
// no screen there either); "interim" pages hold a route until its rebuild phase.

/** The live `/coming-soon/*` template: header with the module name and "Coming soon", then the placeholder. */
export function ComingSoonPage({
  title,
  icon: Icon,
  message,
}: {
  title: string;
  icon: SvgIconComponent;
  message?: string;
}) {
  return (
    <HubManagementLayout>
      <ModulePageHeader icon={<Icon />} title={title} subtitle="Coming soon" />
      <ComingSoonPlaceholder title={title} icon={<Icon fontSize="large" />} message={message} />
    </HubManagementLayout>
  );
}

/** Holds a built module's route until its rebuild phase. */
export function InterimModulePage({
  title,
  subtitle,
  icon: Icon,
  phase,
  spec,
}: {
  title: string;
  subtitle?: string;
  icon: SvgIconComponent;
  phase: number;
  spec: string;
}) {
  return (
    <HubManagementLayout>
      <ModulePageHeader icon={<Icon />} title={title} subtitle={subtitle} />
      <ComingSoonPlaceholder
        title={title}
        icon={<Icon fontSize="large" />}
        badge="Rebuild in progress"
        message={`This screen is rebuilt in phase ${phase}. Its spec is in ${spec}.`}
      />
    </HubManagementLayout>
  );
}

/** The live practice placeholder (Documents, Recruitment…): centred on the grey page, no header. */
export function PracticePlaceholderPage({
  title,
  icon: Icon,
  message,
}: {
  title: string;
  icon: SvgIconComponent;
  message: string;
}) {
  return (
    <Box sx={{ minHeight: 'calc(100dvh - 140px)', display: 'grid', placeItems: 'center' }}>
      <ComingSoonPlaceholder title={title} icon={<Icon fontSize="large" />} message={message} size="practice" />
    </Box>
  );
}
