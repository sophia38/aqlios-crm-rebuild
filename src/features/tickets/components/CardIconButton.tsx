import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

/** A small header icon button (↻ refresh, ⤢ expand) with a tooltip matching its aria-label. */
export function CardIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} size="small" onClick={onClick} sx={{ color: 'text.secondary' }}>
        {children}
      </IconButton>
    </Tooltip>
  );
}
