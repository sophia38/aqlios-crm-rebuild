'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

export interface ToggleOptionRowProps {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  isDefault: boolean;
  onSetDefault: () => void;
  /** Always enabled and never the default (Admin Work). */
  locked?: boolean;
}

/** Enable/disable an option and choose the default (COMPONENTS.md → ToggleOptionRow). */
export function ToggleOptionRow({
  label,
  enabled,
  onEnabledChange,
  isDefault,
  onSetDefault,
  locked,
}: ToggleOptionRowProps) {
  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        py: 1,
        borderRadius: `${theme.tokens.radius.input}px`,
        border: `1px solid ${theme.tokens.border.medium}`,
      })}
    >
      <FormControlLabel
        control={
          <Checkbox
            checked={enabled}
            disabled={locked}
            onChange={(event) => onEnabledChange(event.target.checked)}
            sx={(theme) => ({ '&.Mui-checked': { color: theme.palette.primary.main } })}
          />
        }
        label={label}
        sx={{ '& .MuiFormControlLabel-label': { fontSize: 14 } }}
      />
      {!locked &&
        (isDefault ? (
          <Box
            component="span"
            sx={(theme) => ({
              px: 1.5,
              py: 0.5,
              fontSize: 12,
              fontWeight: 600,
              borderRadius: `${theme.tokens.radius.pill}px`,
              bgcolor: theme.palette.brand.main,
              color: theme.palette.brand.contrastText,
            })}
          >
            Default
          </Box>
        ) : (
          <Button
            variant="outlined"
            size="small"
            onClick={onSetDefault}
            disabled={!enabled}
            aria-label={`Set ${label} as default`}
            sx={(theme) => ({ borderRadius: `${theme.tokens.radius.pill}px`, py: 0.25 })}
          >
            Set as Default
          </Button>
        ))}
    </Box>
  );
}
