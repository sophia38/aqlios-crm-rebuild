import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

export type PanelState = 'loading' | 'error' | 'ready';

export interface DashboardPanelProps {
  title: string;
  subtitle?: React.ReactNode;
  state: PanelState;
  onRetry?: () => void;
  /** Shown instead of the content when the panel loaded but has nothing to show. */
  emptyMessage?: string | null;
  children?: React.ReactNode;
}

/**
 * White dashboard card with a title, a subtitle and its own loading, error and empty states, so one
 * failed request doesn't blank the whole dashboard (COMPONENTS.md → DashboardPanel).
 */
export function DashboardPanel({ title, subtitle, state, onRetry, emptyMessage, children }: DashboardPanelProps) {
  const headingId = `panel-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      aria-busy={state === 'loading' || undefined}
      sx={(theme) => ({
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: `${theme.tokens.radius.tile}px`,
        border: `1px solid ${theme.tokens.shell.panelBorder}`,
      })}
    >
      <Typography
        id={headingId}
        component="h2"
        sx={(theme) => ({ fontSize: 15, fontWeight: 600, color: theme.tokens.shell.ink })}
      >
        {title}
      </Typography>
      <Typography sx={(theme) => ({ mb: 2, fontSize: 12, color: theme.tokens.shell.inkMuted, minHeight: 18 })}>
        {state === 'ready' ? subtitle : ''}
      </Typography>
      {state === 'loading' && (
        <Box>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} height={28} />
          ))}
        </Box>
      )}
      {state === 'error' && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Couldn’t load {title.toLowerCase()}.
          </Typography>
          {onRetry && (
            <Button size="small" variant="outlined" onClick={onRetry}>
              Try again
            </Button>
          )}
        </Box>
      )}
      {state === 'ready' &&
        (emptyMessage ? (
          <Typography variant="body2" sx={{ py: 3, textAlign: 'center' }}>
            {emptyMessage}
          </Typography>
        ) : (
          children
        ))}
    </Box>
  );
}
