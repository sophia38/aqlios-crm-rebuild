'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import FactCheckOutlined from '@mui/icons-material/FactCheckOutlined';
import { PracticeFilterSelect, type PracticeOption } from '@/components/data/PracticeFilterSelect';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { SettingsShell } from '@/components/layout/SettingsShell';
import { CQC_CHECK_AREAS, CQC_SURVEY_AREA } from '@/lib/api/cqc';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi } from '@/lib/api/practiceManagement';

const SECTIONS = [
  { key: 'overview', label: 'Overview', subtitle: 'The predicted rating across every area for the selected practice.' },
  ...CQC_CHECK_AREAS,
  { key: CQC_SURVEY_AREA.key, label: CQC_SURVEY_AREA.label, subtitle: CQC_SURVEY_AREA.subtitle },
  {
    key: 'action-plan',
    label: 'Action Plan',
    subtitle: 'Every gap points to one action. Close it only after completion evidence and an effectiveness check.',
  },
];

const PracticeContext = createContext<PracticeOption | null>(null);

/** The practice whose tracker the module is showing. */
export function useCqcPractice() {
  const practice = useContext(PracticeContext);
  if (!practice) throw new Error('useCqcPractice must be used inside CqcShell');
  return practice;
}

/**
 * CQC Compliance frame: breadcrumbs, header, the practice picker and the area nav. It lives in the
 * module's layout, so the chosen practice stays while you move between areas.
 */
export function CqcShell({ children }: { children: React.ReactNode }) {
  const { enqueueSnackbar } = useSnackbar();
  const { vertical } = useParams<{ vertical: string }>();
  const pathname = usePathname().replace(/\/$/, '');
  const [practice, setPractice] = useState<PracticeOption | null>(null);
  const [loading, setLoading] = useState(true);

  // Start on the first practice, so the page never opens empty.
  useEffect(() => {
    const controller = new AbortController();
    practiceManagementApi
      .practices(PUBLIC_SUB_APP_ID, { page_size: 1 }, controller.signal)
      .then((result) => setPractice(result.results[0] ?? null))
      .catch(() => !controller.signal.aborted && enqueueSnackbar('Failed to load practices', { variant: 'error' }))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [enqueueSnackbar]);

  const base = `/verticals/${vertical}/cqc-compliance`;
  const key = pathname.startsWith(base) ? pathname.slice(base.length).replace(/^\//, '') || 'overview' : 'overview';
  const section = SECTIONS.find((item) => item.key === key) ?? SECTIONS[0];

  return (
    <HubManagementLayout hubManagementBreadcrumbs={[{ label: 'Compliance' }, { label: 'CQC Compliance' }]}>
      <ModulePageHeader icon={<FactCheckOutlined />} title="CQC Compliance" subtitle="Inspection readiness" />
      <Box sx={{ mb: 2.5, maxWidth: 360 }}>
        <PracticeFilterSelect
          label="Practice"
          value={practice}
          // A practice is always selected here, so clearing the field keeps the current one.
          onChange={(next) => next && setPractice(next)}
        />
      </Box>
      {loading ? (
        <LoadingSpinner message="Loading practices..." />
      ) : !practice ? (
        <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
          No practices found. Onboard a practice first.
        </Box>
      ) : (
        <SettingsShell
          navLabel="CQC Compliance sections"
          sections={SECTIONS.map(({ key: sectionKey, label }) => ({ key: sectionKey, label }))}
          active={section.key}
          hrefFor={(sectionKey) => (sectionKey === 'overview' ? base : `${base}/${sectionKey}`)}
          title={section.label}
          subtitle={section.subtitle}
        >
          {/* Remounting on practice change reloads every list for the new practice. */}
          <PracticeContext.Provider key={practice.id} value={practice}>
            {children}
          </PracticeContext.Provider>
        </SettingsShell>
      )}
    </HubManagementLayout>
  );
}
