import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

export interface RoleCount {
  role: string;
  count: number;
}

const SIZE = 120;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Ring of staff by role with the total in the middle and a legend (dashboard "Who works here"). */
export function RoleRing({ roles }: { roles: RoleCount[] }) {
  const theme = useTheme();
  const palette = theme.tokens.shell.chart.roles;
  const total = roles.reduce((sum, item) => sum + item.count, 0);
  // Each segment starts where the ones before it end.
  const segments = roles.map((item, index) => {
    const length = total ? (item.count / total) * CIRCUMFERENCE : 0;
    const before = roles
      .slice(0, index)
      .reduce((sum, prev) => sum + (total ? (prev.count / total) * CIRCUMFERENCE : 0), 0);
    return { ...item, length, offset: before, color: palette[index % palette.length] };
  });
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
      <Box sx={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={theme.tokens.shell.chart.track}
            strokeWidth={STROKE}
          />
          {segments.map((segment) => (
            <circle
              key={segment.role}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          ))}
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center' }}>
          <Typography sx={(theme) => ({ fontSize: 24, fontWeight: 700, lineHeight: 1, color: theme.tokens.shell.ink })}>
            {total}
          </Typography>
          <Typography sx={(theme) => ({ fontSize: 11, color: theme.tokens.shell.inkMuted })}>
            {total === 1 ? 'person' : 'people'}
          </Typography>
        </Box>
      </Box>
      <Box component="ul" sx={{ flex: 1, minWidth: 160, listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
        {roles.map((item, index) => (
          <Box
            component="li"
            key={item.role}
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: 12.5,
              color: theme.tokens.shell.ink,
            })}
          >
            <Box
              aria-hidden
              sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: palette[index % palette.length] }}
            />
            <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
              {item.role}
            </Box>
            <Box component="span" sx={{ fontWeight: 600 }}>
              {item.count}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
