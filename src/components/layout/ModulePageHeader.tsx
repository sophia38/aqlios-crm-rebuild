import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export interface ModulePageHeaderProps {
  /** Icon tile on the left. Practice pages have none (docs/plans/phase-5-practice-modules.md). */
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  /** Chips after the title, e.g. the patient's registration type. */
  titleAdornment?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Optional icon tile, title and subtitle, actions on the right (COMPONENTS.md → ModulePageHeader). */
export function ModulePageHeader({ icon, title, subtitle, titleAdornment, actions }: ModulePageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 3 }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
        {icon && (
          <Box
            aria-hidden
            sx={(theme) => ({
              width: 52,
              height: 52,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              bgcolor: 'background.paper',
              color: 'primary.main',
              boxShadow: theme.tokens.shadow.sm,
            })}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5 }}>
            <Typography
              variant="moduleTitle"
              component="h1"
              sx={(theme) => ({ fontSize: { xs: 22, sm: theme.typography.moduleTitle.fontSize } })}
            >
              {title}
            </Typography>
            {titleAdornment}
          </Box>
          {subtitle && (
            <Typography sx={(theme) => ({ fontSize: 16, color: theme.tokens.text.muted })}>{subtitle}</Typography>
          )}
        </Box>
      </Stack>
      {actions && <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box>}
    </Stack>
  );
}
