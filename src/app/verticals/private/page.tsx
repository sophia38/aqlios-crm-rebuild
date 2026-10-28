'use client';

import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import { ComingSoonPlaceholder } from '@/components/feedback/ComingSoonPlaceholder';
import { UserMenu } from '@/components/layout/UserMenu';
import { BrandLogo } from '@/components/primitives/BrandLogo';

/** Private Business is out of scope for the rebuild (approved placeholder, docs/plans/phase-1-views.md). */
export default function PrivateBusinessPage() {
  return (
    <Box sx={{ minHeight: '100dvh', px: { xs: 2, md: 5 }, py: 3 }}>
      <Box component="header" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          component={Link}
          href="/verticals"
          variant="outlined"
          startIcon={<ChevronLeft />}
          sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px` })}
        >
          Back to Verticals
        </Button>
        <BrandLogo height={30} />
        <UserMenu />
      </Box>
      <Box
        component="main"
        sx={(theme) => ({ bgcolor: theme.tokens.surface.panel, borderRadius: `${theme.tokens.radius.panel}px` })}
      >
        <ComingSoonPlaceholder
          title="Private Business"
          message="Private Business is not part of this rebuild. Only Public Primary Care is being rebuilt."
        />
      </Box>
    </Box>
  );
}
