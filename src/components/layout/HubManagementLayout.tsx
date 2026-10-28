import Link from 'next/link';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export interface Crumb {
  label: string;
  href?: string;
}

/** Breadcrumbs plus the grey rounded page panel (COMPONENTS.md → HubManagementLayout). */
export function HubManagementLayout({
  hubManagementBreadcrumbs,
  children,
}: {
  hubManagementBreadcrumbs?: Crumb[];
  children: React.ReactNode;
}) {
  return (
    <Box>
      {hubManagementBreadcrumbs && hubManagementBreadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2, fontSize: 13 }}>
          {hubManagementBreadcrumbs.map((crumb, index) => {
            const last = index === hubManagementBreadcrumbs.length - 1;
            return crumb.href && !last ? (
              <MuiLink
                key={crumb.label}
                component={Link}
                href={crumb.href}
                underline="hover"
                color="text.primary"
                sx={{ fontSize: 13 }}
              >
                {crumb.label}
              </MuiLink>
            ) : (
              <Typography
                key={crumb.label}
                aria-current={last ? 'page' : undefined}
                sx={{ fontSize: 13, color: last ? 'text.secondary' : 'text.primary' }}
              >
                {crumb.label}
              </Typography>
            );
          })}
        </Breadcrumbs>
      )}
      <Box
        sx={(theme) => ({
          bgcolor: theme.tokens.surface.panel,
          borderRadius: `${theme.tokens.radius.panel}px`,
          p: { xs: 2, md: 3 },
          minHeight: 'calc(100dvh - 200px)',
        })}
      >
        {children}
      </Box>
    </Box>
  );
}
