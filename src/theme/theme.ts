'use client';

import { createTheme } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import { border, neutral, palette, radius, shadow, surface, text, tokens, type Tokens } from './tokens';
import { fontFamily, typography } from './typography';

declare module '@mui/material/styles' {
  interface Theme {
    tokens: Tokens;
  }
  interface ThemeOptions {
    tokens?: Tokens;
  }
  interface Palette {
    brand: Palette['primary'] & { soft: string };
    neutral: typeof neutral;
  }
  interface PaletteOptions {
    brand?: PaletteOptions['primary'] & { soft?: string };
    neutral?: typeof neutral;
  }
  interface TypographyVariants {
    moduleTitle: React.CSSProperties;
    pageTitle: React.CSSProperties;
    sectionTitle: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    moduleTitle?: React.CSSProperties;
    pageTitle?: React.CSSProperties;
    sectionTitle?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    moduleTitle: true;
    pageTitle: true;
    sectionTitle: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    brand: true;
  }
}

export const theme = createTheme({
  tokens,
  palette: {
    mode: 'light',
    primary: palette.primary,
    secondary: palette.secondary,
    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    brand: palette.brand,
    neutral,
    background: { default: surface.background, paper: surface.background },
    text: { primary: text.primary, secondary: text.secondary, disabled: text.disabled },
    divider: border.divider,
  },
  shape: { borderRadius: radius.base },
  typography,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: surface.background, fontFamily: fontFamily.poppins },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.base, padding: '0.7rem 1.25rem' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true },
    },
    MuiInputBase: {
      defaultProps: { autoComplete: 'off' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radius.input,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: border.subtle },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: border.dark },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: palette.primary.main, borderWidth: 1 },
          '&.Mui-disabled': { backgroundColor: neutral[100], opacity: 0.7 },
          '&:has(input[readonly])': { backgroundColor: neutral[50] },
          '& input:-webkit-autofill': { WebkitBoxShadow: `0 0 0 100px ${surface.background} inset` },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: {
          color: text.secondary,
          '&.MuiInputLabel-shrink': { backgroundColor: surface.background, paddingInline: 4 },
        },
        asterisk: { color: text.asterisk },
      },
    },
    MuiFormLabel: {
      styleOverrides: { asterisk: { color: text.asterisk } },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: { color: border.subtle, '&.Mui-checked': { color: palette.secondary.main } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: radius.base },
        outlined: { border: `1px solid ${border.dark}` },
      },
    },
    MuiPopover: {
      styleOverrides: { paper: { boxShadow: shadow.md } },
    },
    MuiPickerDay: {
      styleOverrides: {
        root: {
          borderRadius: radius.pickerItem,
          '&:hover': { backgroundColor: surface.tealLight },
          '&.Mui-selected': { backgroundColor: palette.primary.main },
        },
      },
    },
  },
});
