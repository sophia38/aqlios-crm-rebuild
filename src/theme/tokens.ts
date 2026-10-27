// Design tokens extracted verbatim from the live app (docs/design-tokens.md).
// Components never hardcode these values: read them from the MUI theme or from here.

export const palette = {
  primary: { main: '#2C7A7B', light: '#2C7A7B', dark: '#255A5C', contrastText: '#FFFFFF' },
  secondary: { main: '#0EA5E9', light: '#38BDF8', dark: '#0369A1', contrastText: '#FFFFFF' },
  success: { main: '#16A34A', light: '#22C55E', dark: '#166534', contrastText: '#FFFFFF' },
  error: { main: '#DC2626', light: '#F97373', dark: '#991B1B', contrastText: '#FFFFFF' },
  warning: { main: '#F97316', light: '#FDBA74', dark: '#C2410C', contrastText: '#FFFFFF' },
  brand: {
    main: '#5CE1E6',
    light: '#8CEFF2',
    dark: '#3FCDD3',
    contrastText: '#255A5C',
    soft: 'rgba(92,225,230,0.16)',
  },
} as const;

export const neutral = {
  50: '#F9FAFB',
  75: '#F5F5F5',
  100: '#F3F4F6',
  150: '#EAEAEA',
  200: '#E5E7EB',
  300: '#D1D5DB',
  350: '#BDBDBD',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2933',
  900: '#111827',
} as const;

export const surface = {
  background: '#FFFFFF',
  tealLight: '#E0F2F1',
  canvas: '#FCFCFC',
  panel: '#F5F5F5', // ds.canvas: grey page panel
  subtleFill: '#FAFAFA',
} as const;

export const text = {
  primary: 'rgba(0,0,0,0.78)',
  secondary: 'rgba(0,0,0,0.55)',
  disabled: 'rgba(0,0,0,0.38)',
  strong: 'rgba(0,0,0,0.87)',
  iconDark: '#112744',
  asterisk: '#D32F2F',
} as const;

export const border = {
  subtle: 'rgba(0,0,0,0.06)',
  bold: 'rgba(0,0,0,0.2)',
  dark: 'rgba(148,163,184,0.2)',
  light: '#F0F0F0',
  medium: '#EEEEEE',
  infoLight: '#DDEBFF',
  divider: 'rgba(0,0,0,0.12)',
  field: 'rgba(0,0,0,0.23)',
} as const;

export const status = {
  rejected: { text: '#EF4444', bg: 'rgba(239,68,68,0.05)' },
  pendingVerification: { text: '#0284C7', bg: 'rgba(2,132,199,0.05)' },
  expired: { text: '#78716C', bg: 'rgba(120,113,108,0.05)' },
  verified: { text: '#16A34A', bg: 'rgba(22,163,74,0.05)' },
  moreInfoRequired: { text: '#2C7A7B', bg: 'transparent' },
} as const;

export const tone = {
  success: { main: '#2E7D32', strongBg: '#EDF7ED', strongInk: '#2E7D32' },
  warning: { main: '#EF6C00', strongBg: '#FFF4E5', strongInk: '#663C00' },
  // The live app defines only `main` for error; strongBg/strongInk are MUI's standard error Alert colours.
  error: { main: '#D32F2F', strongBg: '#FDEDED', strongInk: '#5F2120' },
  info: { main: '#0288D1', strongBg: '#E8F1FB', strongInk: '#1976D2' },
  secondary: { main: '#9C27B0', strongBg: '#F1ECFA', strongInk: '#5E35B1' },
} as const;

export const sidebar = {
  surface: '#FFFFFF',
  itemHoverBg: '#EFFCFC',
  itemText: 'rgba(0,0,0,0.87)',
  openSectionBg: '#F5F5F5',
  openSectionHeaderBg: '#EEEEEE',
  shadow: '0px 1px 8px 0px rgba(0,0,0,0.15)',
  profileCardBg: '#DEF9FA',
  avatarBg: '#4AB4B8',
  avatarText: '#EFFCFC',
} as const;

// Feature-scoped colour maps (ROTA). Other feature groups are added when their module is built.
export const dutyType = {
  ON_CALL: '#FB3748',
  CARE_HOME_WARD_ROUND: '#7D52F4',
  EXTENDED_ACCESS: '#FBD249',
  NURSING: '#717784',
  ADMIN_SESSION: '#22D3BB',
  NEIGHBOURHOOD_SHIFT: '#FF936C',
  REMOTE_WORK: '#95C3FF',
  PPT_PLT_CPD: '#FFD5C0',
  AM_SESSION: '#03A9F4',
  PM_SESSION: '#1FC16B',
} as const;

export const radius = {
  base: 18, // theme.shape.borderRadius: paper, buttons, pickers
  input: 12,
  pill: 999,
  pickerItem: 10,
  loginButton: 16,
  switchTrack: 13,
  panel: 24,
  card: 20,
} as const;

export const shadow = {
  sm: '0 10px 22px rgba(15,23,42,0.06)',
  md: '0 20px 45px rgba(15,23,42,0.08)',
  card: '0 10px 30px rgba(15,23,42,0.08)',
  cardLarge: '0 16px 34px rgba(15,23,42,0.06)',
  formModal: '0 10px 40px rgba(15,23,42,0.25)',
  menu: '0 8px 24px rgba(15,23,41,0.10)',
  drag: '0 8px 18px rgba(15,23,41,0.14)',
} as const;

export const tokens = {
  palette,
  neutral,
  surface,
  text,
  border,
  status,
  tone,
  sidebar,
  dutyType,
  radius,
  shadow,
} as const;

export type Tokens = typeof tokens;
