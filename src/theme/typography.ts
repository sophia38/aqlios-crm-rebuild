import type { ThemeOptions } from '@mui/material/styles';
import { text } from './tokens';

// Typography scale from the live app (bundle module 42548, docs/design-tokens.md).
// Poppins and Inter are loaded with next/font in src/app/layout.tsx as CSS variables.
export const fontFamily = {
  poppins: 'var(--font-poppins), Poppins, sans-serif',
  inter: 'var(--font-inter), Inter, sans-serif',
} as const;

export const typography: ThemeOptions['typography'] = {
  fontFamily: fontFamily.poppins,
  h1: { fontSize: '3.5rem', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.04em' },
  h2: { fontSize: '3rem', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.04em' },
  h3: { fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.03em' },
  h4: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em' },
  h5: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.01em' },
  h6: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.35 },
  subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.01em' },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
  body1: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.6, color: text.primary },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.6, color: text.secondary },
  button: { fontWeight: 500, letterSpacing: '0.04em', textTransform: 'none' },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4, color: text.secondary },
  overline: { fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase' },
  // Observed page-level styles (not MUI defaults): page title 24/700, section heading 20/700.
  pageTitle: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3, color: text.primary },
  sectionTitle: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.35, color: text.primary },
};
