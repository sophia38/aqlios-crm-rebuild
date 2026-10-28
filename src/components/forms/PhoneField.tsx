'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import InputAdornment from '@mui/material/InputAdornment';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';

// Only the UK is offered, as in the live app.
const COUNTRIES = [{ code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' }];

export interface PhoneFieldProps {
  name: string;
  label: string;
  /** Full number including the dial code, e.g. "+44 113 496 0000". */
  value: string;
  onChange: (value: string) => void;
  onBlur?: (event: React.FocusEvent) => void;
  required?: boolean;
  error?: boolean;
  helperText?: React.ReactNode;
  disabled?: boolean;
}

/** Phone input with a (UK-only, searchable) country picker (COMPONENTS.md → PhoneField). */
export function PhoneField({
  name,
  label,
  value,
  onChange,
  onBlur,
  required,
  error,
  helperText,
  disabled,
}: PhoneFieldProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const country = COUNTRIES[0];
  const local = value.startsWith(country.dial) ? value.slice(country.dial.length).trimStart() : value;
  const matches = COUNTRIES.filter((item) => `${item.name} ${item.dial}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <TextField
        id={name}
        name={name}
        label={label}
        required={required}
        type="tel"
        autoComplete="tel"
        value={local}
        onChange={(event) => onChange(`${country.dial} ${event.target.value.replace(/[^\d\s]/g, '')}`.trimEnd())}
        onBlur={onBlur}
        error={error}
        helperText={helperText}
        disabled={disabled}
        placeholder="1234 567890"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <ButtonBase
                  onClick={(event) => setAnchor(event.currentTarget)}
                  aria-label={`Country: ${country.name} ${country.dial}`}
                  aria-haspopup="listbox"
                  disabled={disabled}
                  sx={{ gap: 0.5, px: 0.5, borderRadius: 1, fontSize: 14 }}
                >
                  <span aria-hidden>{country.flag}</span>
                  {country.dial}
                  <ArrowDropDown fontSize="small" />
                </ButtonBase>
              </InputAdornment>
            ),
          },
        }}
      />
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <ListSubheader sx={{ pt: 1 }}>
          <TextField
            size="small"
            autoFocus
            placeholder="Search countries"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            slotProps={{ htmlInput: { 'aria-label': 'Search countries' } }}
          />
        </ListSubheader>
        {matches.length === 0 && <MenuItem disabled>No countries found</MenuItem>}
        {matches.map((item) => (
          <MenuItem key={item.code} selected={item.code === country.code} onClick={() => setAnchor(null)}>
            <Box component="span" aria-hidden sx={{ mr: 1 }}>
              {item.flag}
            </Box>
            {item.name} {item.dial}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
