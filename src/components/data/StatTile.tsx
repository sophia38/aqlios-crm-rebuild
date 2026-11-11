import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

export interface StatTileProps {
  label: string;
  /** null while loading; a string such as "79%" or "—" otherwise. */
  value: React.ReactNode | null;
  caption?: React.ReactNode;
  icon: React.ReactNode;
  /** Icon circle colours. */
  tone: { bg: string; fg: string };
}

/** White KPI tile: tinted icon circle, label, big number and a caption (COMPONENTS.md → StatTile). */
export function StatTile({ label, value, caption, icon, tone }: StatTileProps) {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 1.75,
        p: 2,
        minWidth: 0,
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.tile}px`,
        border: `1px solid ${theme.tokens.shell.panelBorder}`,
      })}
    >
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          // Phones show two tiles a row, so the icon gives its room to the label.
          display: { xs: 'none', sm: 'grid' },
          placeItems: 'center',
          borderRadius: '50%',
          bgcolor: tone.bg,
          color: tone.fg,
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={(theme) => ({ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3, color: theme.tokens.shell.ink })}
        >
          {label}
        </Typography>
        <Typography
          component="p"
          sx={(theme) => ({ fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: theme.tokens.shell.ink })}
        >
          {value ?? <Skeleton width={48} />}
        </Typography>
        <Typography sx={(theme) => ({ fontSize: 11.5, color: theme.tokens.shell.inkMuted, minHeight: 17 })}>
          {value === null ? '' : caption}
        </Typography>
      </Box>
    </Box>
  );
}
