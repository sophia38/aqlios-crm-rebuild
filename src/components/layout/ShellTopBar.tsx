import Box, { type BoxProps } from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';

/** Round 46px icon button for the top bar (🔔, ☰). */
export const shellRoundButton = (theme: Theme) => ({
  width: 46,
  height: 46,
  border: `1px solid ${theme.tokens.shell.line}`,
  bgcolor: 'background.paper',
  color: theme.tokens.shell.ink,
  '&:hover': { bgcolor: theme.tokens.shell.well },
});

export interface ShellTopBarProps {
  start: React.ReactNode;
  /** Centre slot (the global search). Without it the bar is three columns of `1fr auto 1fr`. */
  middle?: React.ReactNode;
  end: React.ReactNode;
  /** Sticks to the top of the canvas while the page scrolls (vertical shell). */
  sticky?: boolean;
  sx?: BoxProps['sx'];
}

/** The refined shell's white rounded top bar (COMPONENTS.md → ShellTopBar), used by VerticalShell and /verticals. */
export function ShellTopBar({ start, middle, end, sticky = false, sx }: ShellTopBarProps) {
  return (
    <Box
      component="header"
      sx={[
        (theme) => ({
          gridArea: 'top',
          position: sticky ? 'sticky' : 'static',
          top: sticky ? theme.spacing(1.75) : undefined,
          zIndex: theme.zIndex.appBar,
          display: 'grid',
          gridTemplateColumns: middle
            ? { xs: 'auto minmax(0, 1fr) auto', md: '1fr minmax(280px, 560px) 1fr' }
            : '1fr auto 1fr',
          alignItems: 'center',
          gap: { xs: 1, md: 2 },
          minHeight: { xs: 60, md: 72 },
          px: { xs: 1, md: 1.5 },
          borderRadius: `${theme.tokens.radius.pill}px`,
          bgcolor: 'background.paper',
          border: `1px solid ${theme.tokens.shell.panelBorder}`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box sx={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>{start}</Box>
      {middle ? <Box sx={{ minWidth: 0, width: '100%' }}>{middle}</Box> : <span />}
      <Box sx={{ justifySelf: 'end', display: 'flex', alignItems: 'center', gap: 1.25 }}>{end}</Box>
    </Box>
  );
}
