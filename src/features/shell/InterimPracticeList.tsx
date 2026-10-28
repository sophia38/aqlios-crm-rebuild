'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import GridViewOutlined from '@mui/icons-material/GridViewOutlined';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { HubManagementLayout } from '@/components/layout/HubManagementLayout';
import { ModulePageHeader } from '@/components/layout/ModulePageHeader';
import { EntityAvatar } from '@/components/primitives/EntityAvatar';
import { PUBLIC_SUB_APP_ID } from '@/lib/api/config';
import { practiceManagementApi, practiceSlug } from '@/lib/api/practiceManagement';
import type { Practice } from '@/lib/api/types';

/**
 * Interim practice picker so practice routes are reachable before the real grid (phase 3).
 * Shows the first 12 practices the user can see.
 */
export function InterimPracticeList({ vertical }: { vertical: string }) {
  const [practices, setPractices] = useState<Practice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    practiceManagementApi
      .practices(PUBLIC_SUB_APP_ID, { page: 1, page_size: 12 }, controller.signal)
      .then((result) => setPractices(result.results))
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Failed to load practices');
      });
    return () => controller.abort();
  }, []);

  return (
    <HubManagementLayout>
      <ModulePageHeader icon={<GridViewOutlined />} title="Public Practice" subtitle="Practice List" />
      <Typography variant="body2" sx={{ mb: 2 }}>
        Interim list: the full practice grid is rebuilt in phase 3.
      </Typography>
      {error && <Typography sx={{ color: 'error.main' }}>{error}</Typography>}
      {!practices && !error && <LoadingSpinner message="Loading practices..." />}
      {practices && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {practices.map((practice) => (
            <ButtonBase
              key={practice.id}
              component={Link}
              href={`/verticals/${vertical}/practices/${practiceSlug(practice.practice_name)}/dashboard`}
              sx={(theme) => ({
                justifyContent: 'flex-start',
                gap: 1.5,
                p: 1.5,
                borderRadius: `${theme.tokens.radius.card}px`,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.tokens.border.medium}`,
                '&:hover': { boxShadow: theme.tokens.shadow.card },
              })}
            >
              <EntityAvatar name={practice.practice_name} logoSrc={practice.logo_url} size={40} />
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary', textAlign: 'left' }}>
                {practice.practice_name}
              </Typography>
            </ButtonBase>
          ))}
        </Box>
      )}
    </HubManagementLayout>
  );
}
