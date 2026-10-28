import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';

export interface ComingSoonPlaceholderProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  /** Pill text; interim screens of the rebuild use "Rebuild in progress". */
  badge?: string;
  /** `practice`: the practice-level placeholder (smaller title, sits on the grey page). */
  size?: 'default' | 'practice';
}

/**
 * Centred placeholder for unbuilt modules: icon circle, title, message and COMING SOON pill
 * (docs/super-admin/07-payroll.md). The page header around it comes from the page's shell.
 */
export function ComingSoonPlaceholder({
  title,
  message = `We are currently building ${title}. It will be available here soon.`,
  icon = <ConstructionOutlinedIcon fontSize="large" />,
  badge = 'Coming soon',
  size = 'default',
}: ComingSoonPlaceholderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
        py: 8,
        px: 2,
      }}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          width: 72,
          height: 72,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: theme.tokens.surface.tealLight,
          color: 'primary.main',
          mb: 1,
        })}
      >
        {icon}
      </Box>
      <Typography
        component="h2"
        sx={{ fontSize: size === 'practice' ? 22 : 28, fontWeight: 700, color: 'text.primary' }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: 16, color: 'text.secondary', maxWidth: 520 }}>{message}</Typography>
      <Box
        component="span"
        sx={(theme) => ({
          mt: 1,
          px: 2,
          py: 0.5,
          fontSize: 13,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: theme.tokens.palette.accent.teal,
          bgcolor: theme.tokens.surface.tealLight,
          borderRadius: `${theme.tokens.radius.pill}px`,
        })}
      >
        {badge}
      </Box>
    </Box>
  );
}
