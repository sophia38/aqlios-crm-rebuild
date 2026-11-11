import Box from '@mui/material/Box';
import { SIDEBAR_WIDTH } from '@/components/layout/AppSidebar';

export interface ShellCanvasProps {
  /** The `ShellTopBar` (sticky on desktop). */
  topBar: React.ReactNode;
  /** The floating sidebar panel, or nothing (phones, practice users at vertical level). */
  sidebar?: React.ReactNode;
  collapsed?: boolean;
  /** `paper`: white main panel (hub pages bring their own grey panel). `panel`: grey (practice pages' white cards). */
  mainTone?: 'paper' | 'panel';
  children: React.ReactNode;
}

/**
 * Refined shell layout (COMPONENTS.md → ShellCanvas): a grey canvas with the top bar across, the
 * sidebar panel on the left and the rounded main panel. Used by VerticalShell and PracticeShell.
 */
export function ShellCanvas({ topBar, sidebar, collapsed = false, mainTone = 'paper', children }: ShellCanvasProps) {
  const withSidebar = Boolean(sidebar);
  return (
    <Box
      sx={(theme) => ({
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: withSidebar
          ? `${collapsed ? SIDEBAR_WIDTH.collapsed : SIDEBAR_WIDTH.panel}px minmax(0, 1fr)`
          : 'minmax(0, 1fr)',
        gridTemplateAreas: withSidebar ? '"top top" "side main"' : '"top" "main"',
        gridTemplateRows: 'auto 1fr',
        alignItems: 'start',
        gap: { xs: 1.25, md: 1.75 },
        p: { xs: 1.25, md: 1.75 },
        bgcolor: theme.tokens.shell.canvas,
        transition: theme.transitions.create('grid-template-columns'),
      })}
    >
      {topBar}
      {sidebar}
      <Box
        component="main"
        sx={(theme) => ({
          gridArea: 'main',
          alignSelf: 'stretch',
          minWidth: 0,
          minHeight: { md: `calc(100dvh - 72px - ${theme.spacing(5.25)})` },
          px: { xs: 1.5, md: 3.5 },
          pt: { xs: 2, md: 2.75 },
          pb: { xs: 2, md: 4 },
          bgcolor: mainTone === 'panel' ? theme.tokens.surface.panel : 'background.paper',
          borderRadius: `${theme.tokens.radius.shellPanel}px`,
          border: `1px solid ${theme.tokens.shell.panelBorder}`,
        })}
      >
        {children}
      </Box>
    </Box>
  );
}
