'use client';

import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export type PasswordFieldProps = Omit<TextFieldProps, 'type'> & {
  /** What the 👁 button names, e.g. "current password" → "Show current password" (captured). */
  toggleLabel?: string;
};

/**
 * Password input with a show/hide toggle (COMPONENTS.md → PasswordField). Extracted from the login
 * page; also used three times on the Profile Security tab.
 */
export function PasswordField({ toggleLabel = 'password', slotProps, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      slotProps={{
        ...slotProps,
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={`${visible ? 'Hide' : 'Show'} ${toggleLabel}`}
                onClick={() => setVisible((value) => !value)}
                edge="end"
                disabled={props.disabled}
              >
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
