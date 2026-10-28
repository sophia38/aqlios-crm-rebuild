'use client';

import Switch, { type SwitchProps } from '@mui/material/Switch';

/** iOS-style switch: 26px track, 13px radius, teal when on (COMPONENTS.md → AppSwitch). */
export function AppSwitch(props: SwitchProps) {
  return (
    <Switch
      disableRipple
      {...props}
      sx={[
        (theme) => ({
          width: 46,
          height: 26,
          p: 0,
          '& .MuiSwitch-switchBase': {
            p: '3px',
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              color: theme.palette.common.white,
              '& + .MuiSwitch-track': { bgcolor: theme.palette.primary.main, opacity: 1 },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': { outline: `2px solid ${theme.palette.primary.main}` },
            '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.5 },
          },
          '& .MuiSwitch-thumb': { width: 20, height: 20, boxShadow: theme.tokens.shadow.sm },
          '& .MuiSwitch-track': {
            borderRadius: `${theme.tokens.radius.switchTrack}px`,
            bgcolor: theme.tokens.control.switchOffTrack,
            opacity: 1,
          },
        }),
        ...(Array.isArray(props.sx) ? props.sx : [props.sx]),
      ]}
    />
  );
}
