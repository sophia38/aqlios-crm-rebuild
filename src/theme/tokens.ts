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
  // COMING SOON pill text (docs/super-admin/07-payroll.md).
  accent: { teal: '#2DD4BF' },
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
  // Observed page backgrounds: Verticals fades white → mint; the login page is light grey.
  mintWash: '#EFFCFC',
  authPage: '#F5F5F5',
} as const;

export const text = {
  primary: 'rgba(0,0,0,0.78)',
  secondary: 'rgba(0,0,0,0.55)',
  disabled: 'rgba(0,0,0,0.38)',
  strong: 'rgba(0,0,0,0.87)',
  muted: 'rgba(0,0,0,0.6)', // login subtitle, "Coming soon" subtitle
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

// Form controls (docs/super-admin/03-onboard-new-practice.md, measured).
export const control = {
  switchOffTrack: '#E9E9EA',
  textareaFill: '#F5F5F5',
  sectionDividerPill: '#F3F4F6',
} as const;

// Table row states (Practice Management list, docs/super-admin/02-practice-onboarding.md).
export const rowState = {
  incomplete: { bg: '#FDF1EC', border: '#E8774A' },
} as const;

// Header user pill (light lavender avatar, observed on /verticals; exact hex approximated from tone.secondary).
export const userPill = {
  avatarBg: '#F1ECFA',
  avatarText: '#5E35B1',
  border: 'rgba(0,0,0,0.06)',
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

// ROTA (docs/super-admin/06-rota-management.md, shift block from docs/practice/06-rota-management.md).
export const rota = {
  session: { AM: '#0EA5E9', PM: '#16A34A' },
  gap: { leave: '#F97316', published: '#06B6D4', holiday: '#22C55E', unallocated: '#D1D5DB' },
  roleChip: { border: '#2C7A7B', bg: '#E0F2F1' },
  contractChip: { bg: '#F3F4F6' },
  practiceChip: { border: '#C2410C', bg: '#FFEDD5' },
  activity: { activeNow: '#2E7D32', inactive: '#FFB400', onLeave: '#9C27B0', stripBg: '#F5F7FA' },
  /** Shift card corner (captured 6px) and legend swatch corner (captured 3px). */
  shiftRadius: 6,
  swatchRadius: 3,
} as const;

// Template Library (docs/super-admin/10-template-library.md). The Ask AI border colours are
// approximated from the capture ("rainbow gradient border"); the exact stops weren't recorded.
export const template = {
  aiGradient: 'linear-gradient(90deg, #F97316, #FACC15, #22C55E, #0EA5E9, #8B5CF6, #EC4899)',
  placeholderText: '#0288D1',
  previewBubble: '#F1F1F1',
  previewNotch: '#E5E7EB',
} as const;

// Patients (docs/practice/01-patients.md): notes are pale-yellow cards. Colours approximated from the capture.
export const patient = {
  noteBg: '#FFF8E1',
  noteBorder: '#FFE7A3',
} as const;

// Leaves (docs/practice/07-leaves-and-leaves-rota.md): balance card value colours per leave type, on a
// grey card. Captured: Annual/TOIL teal, Sick red, Bereavement grey, Compassionate orange, Maternity
// purple; Paternity and Emergency weren't shown, so they reuse the info and dark orange tones.
export const leave = {
  type: {
    ANNUAL: '#2C7A7B',
    SICK: '#DC2626',
    TOIL: '#2C7A7B',
    BEREAVEMENT: '#6B7280',
    COMPASSIONATE: '#F97316',
    MATERNITY: '#9C27B0',
    PATERNITY: '#0288D1',
    EMERGENCY: '#C2410C',
  },
  cardBg: '#F5F5F5',
} as const;

// Navigation shell, login and vertical picker from the team's refined prototype (docs/design-tokens.md →
// "Refined shell"). Vertical level: white top bar, sidebar and main panel floating on a grey canvas.
// Practice level: the prototype's business sidebar.
export const shell = {
  canvas: '#ECEEEE',
  panelBorder: '#DDE2E2',
  line: '#E3E7E7',
  well: '#F4F6F6',
  itemHover: '#F4F8F8',
  ink: '#172322',
  inkMuted: '#5B6766',
  placeholder: '#808B8A',
  accentSoft: '#E8F2F2',
  accentInk: '#1F5D5E',
  focusRing: 'rgba(44,122,123,0.12)',
  danger: '#C2410C',
  dangerHover: '#FDF1EB',
  tooltip: '#172322',
  // Count badge on a filled (teal) tab.
  onPrimaryBadge: 'rgba(255,255,255,0.22)',
  // Account menu (prototype "acct-menu").
  menu: {
    shadow: '0 16px 40px -18px rgba(23,35,34,0.28)',
    divider: '#EEF1F1',
    heading: '#8A9493',
    selected: '#F2F9F9',
    chevron: '#A6AFAE',
    dangerBorder: '#F5D3C4',
  },
  // Practice dashboard charts (Figma "Public GP Flows" 9107:72525).
  chart: {
    covered: '#1F5D5E',
    needsCover: '#E9B949',
    booked: '#7FB2F0',
    cancelled: '#B0B7B6',
    bar: '#4FB3B5',
    track: '#EEF1F1',
    roles: ['#1F5D5E', '#4FB3B5', '#7FB2F0', '#9BD7DA', '#E9B949', '#B0B7B6'],
  },
  practiceNav: {
    label: '#0F4C5C',
    icon: '#525866',
    hoverBg: 'rgba(44,122,123,0.08)',
    activeBg: 'rgba(44,122,123,0.12)',
    profileBg: 'rgba(44,122,123,0.08)',
    divider: 'rgba(0,0,0,0.12)',
  },
  vertical: {
    public: { bg: '#E8F0FB', fg: '#2563B0' },
    private: { bg: '#E8F2F2', fg: '#2C7A7B' },
    everyclinic: { bg: '#F7EEE3', fg: '#9A5B14' },
    soonBg: '#FBFCFC',
    hoverBorder: '#A9CBCB',
  },
  login: {
    brand: 'linear-gradient(160deg, #2C7A7B 0%, #0F4C5C 100%)',
    onBrand: '#FFFFFF',
    onBrandMuted: 'rgba(255,255,255,0.8)',
    onBrandFaint: 'rgba(255,255,255,0.6)',
    onBrandTile: 'rgba(255,255,255,0.12)',
    ring: 'rgba(255,255,255,0.12)',
    ringGlow: '0 0 0 60px rgba(255,255,255,0.03), 0 0 0 120px rgba(255,255,255,0.02)',
    roleBorder: 'rgba(0,0,0,0.12)',
    roleHover: 'rgba(44,122,123,0.5)',
    roleSelectedBg: 'rgba(44,122,123,0.04)',
    roleIconBg: 'rgba(44,122,123,0.08)',
    cardBorder: 'rgba(0,0,0,0.1)',
  },
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
  // Refined shell: floating panels, vertical cards and search results, role cards, icon tiles.
  shellPanel: 28,
  tile: 24,
  roleCard: 14,
  iconTile: 10,
  menuItem: 16,
} as const;

export const shadow = {
  sm: '0 10px 22px rgba(15,23,42,0.06)',
  md: '0 20px 45px rgba(15,23,42,0.08)',
  card: '0 10px 30px rgba(15,23,42,0.08)',
  cardLarge: '0 16px 34px rgba(15,23,42,0.06)',
  formModal: '0 10px 40px rgba(15,23,42,0.25)',
  menu: '0 8px 24px rgba(15,23,41,0.10)',
  drag: '0 8px 18px rgba(15,23,41,0.14)',
  // MUI elevation 1 (refined login card).
  e1: '0 2px 1px -1px rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 1px 3px 0 rgba(0,0,0,0.12)',
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
  shell,
  userPill,
  rowState,
  control,
  dutyType,
  rota,
  template,
  patient,
  leave,
  radius,
  shadow,
} as const;

export type Tokens = typeof tokens;
