# Aqlios design tokens

Extracted 2026-10-27 from the live app's compiled theme (`crm.dev.aqlios.31g.co.uk`, Next.js bundles, webpack modules `50400` tokens, `42548` typography, `45718` MUI theme, `99927` brand theme).
In the rebuild these live in `src/theme/tokens.ts`, `src/theme/typography.ts`, `src/theme/theme.ts`, and are exposed through the MUI theme. Values are verbatim.

## Palette

### Core
| Token | Value | Use |
|---|---|---|
| `primary.main` / `light` | `#2C7A7B` | Primary buttons, active tabs, switches, focus border, links |
| `primary.dark` | `#255A5C` | Primary hover |
| `primary.contrastText` | `#FFFFFF` | |
| `secondary.main` / `light` / `dark` | `#0EA5E9` / `#38BDF8` / `#0369A1` | Sky blue — checkbox checked in base theme |
| `success.main` / `light` / `dark` | `#16A34A` / `#22C55E` / `#166534` | |
| `error.main` / `light` / `dark` | `#DC2626` / `#F97373` / `#991B1B` | Field errors, error section borders |
| `warning.main` / `light` / `dark` | `#F97316` / `#FDBA74` / `#C2410C` | |
| `brand.main` / `light` / `dark` | `#5CE1E6` / `#8CEFF2` / `#3FCDD3` | Login button, brand theme (`99927`) |
| `brand.contrastText` | `#255A5C` | |
| `brand.soft` | `rgba(92,225,230,0.16)` | Brand hover fill |

### Neutral scale
`50 #F9FAFB` · `75 #F5F5F5` · `100 #F3F4F6` · `150 #EAEAEA` · `200 #E5E7EB` · `300 #D1D5DB` · `350 #BDBDBD` · `400 #9CA3AF` · `500 #6B7280` · `600 #4B5563` · `700 #374151` · `800 #1F2933` · `900 #111827`

### Surfaces and text
| Token | Value |
|---|---|
| `background.default/paper/elevated` | `#FFFFFF` |
| `surface.tealLight` | `#E0F2F1` (hover on teal controls) |
| `surface.canvas` | `#FCFCFC` |
| `ds.canvas` | `#F5F5F5` (grey page panel) |
| `ds.subtleFill` | `#FAFAFA` |
| `textOnSurface.primary` | `rgba(0,0,0,0.78)` |
| `textOnSurface.secondary` | `rgba(0,0,0,0.55)` |
| `textOnSurface.disabled` | `rgba(0,0,0,0.38)` |
| `modulePage.title` / `subtitle` | `rgba(0,0,0,0.78)` / `rgba(0,0,0,0.55)` |
| `icon.dark` / sidebar wordmark | `#112744` |
| `form.asterisk` | `#D32F2F` |

### Borders
`border.subtle rgba(0,0,0,0.06)` · `border.bold rgba(0,0,0,0.2)` · `border.dark rgba(148,163,184,0.2)` · `border.light #F0F0F0` · `border.medium #EEEEEE` · `border.infoLight #DDEBFF` · `muiSpec.divider rgba(0,0,0,0.12)` · `muiSpec.fieldBorder rgba(0,0,0,0.23)`

### Status (documents, payroll, verification)
| Status | Text | Bg |
|---|---|---|
| rejected | `#EF4444` | `rgba(239,68,68,0.05)` |
| pendingVerification | `#0284C7` | `rgba(2,132,199,0.05)` |
| expired | `#78716C` | `rgba(120,113,108,0.05)` |
| verified / success | `#16A34A` | `rgba(22,163,74,0.05)` |
| moreInfoRequired | `#2C7A7B` | — |

### Tones (chips and alerts, `ds.tone`)
| Tone | main | strongBg | strongInk |
|---|---|---|---|
| success | `#2E7D32` | `#EDF7ED` | `#2E7D32` |
| warning | `#EF6C00` | `#FFF4E5` | `#663C00` |
| error | `#D32F2F` | — | — |
| info | `#0288D1` | `#E8F1FB` | `#1976D2` |
| secondary | `#9C27B0` | `#F1ECFA` | `#5E35B1` |

### Sidebar
| Token | Value |
|---|---|
| surface | `#FFFFFF` |
| itemHoverBg | `#EFFCFC` |
| item text | `#424242` (private) / `rgba(0,0,0,0.87)` (public) |
| openSectionBg / openSectionHeaderBg | `#F5F5F5` / `#EEEEEE` |
| shadow | `0px 1px 8px 0px rgba(0,0,0,0.15)` |
| active item | bg `alpha(primary,0.12)` + `inset 0 0 0 1px primary` |
| footer profileCardBg / avatarBg / avatarText | `#DEF9FA` / `#4AB4B8` / `#EFFCFC` |

### Domain colour maps (keep as-is, used by ROTA and clinical modules)
`dutyType`: ON_CALL `#FB3748`, CARE_HOME_WARD_ROUND `#7D52F4`, EXTENDED_ACCESS `#FBD249`, NURSING `#717784`, ADMIN_SESSION `#22D3BB`, NEIGHBOURHOOD_SHIFT `#FF936C`, REMOTE_WORK `#95C3FF`, PPT_PLT_CPD `#FFD5C0`, AM_SESSION `#03A9F4`, PM_SESSION `#1FC16B`.
`calendar.status` (available, break, unavailable, dna, cancelled, reserved), `medicalAlert`, `patientManagement`, `patientDashboard`, `pathwayConfiguration`, `payrollStatus` and `tickets` also exist as feature-scoped groups. Copy them verbatim into `tokens.ts` when those modules are built.

## Typography (`42548`)
Font families: `--font-poppins` (default), `--font-inter` (secondary). Dancing Script is also loaded, probably for signatures.

| Variant | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| h1 | 3.5rem | 600 | 1.1 | -0.04em |
| h2 | 3rem | 600 | 1.15 | -0.04em |
| h3 | 2.25rem | 600 | 1.2 | -0.03em |
| h4 | 1.75rem | 600 | 1.25 | -0.02em |
| h5 | 1.5rem | 600 | 1.3 | -0.01em |
| h6 | 1.25rem | 600 | 1.35 | — |
| subtitle1 | 1rem | 500 | 1.5 | -0.01em |
| subtitle2 | 0.875rem | 500 | 1.5 | — |
| body1 | 1rem | 400 | 1.6 | color `textOnSurface.primary` |
| body2 | 0.875rem | 400 | 1.6 | color `textOnSurface.secondary` |
| button | — | 500 | — | 0.04em, `textTransform: none` |
| caption | 0.75rem | 400 | 1.4 | color secondary |
| overline | 0.7rem | 500 | — | 0.16em, uppercase |

Observed on pages: page title 24px / 700, section heading 20px / 700, input text 14px, helper/error text 12px.

## Shape and radii
| Use | Radius |
|---|---|
| `theme.shape.borderRadius` (Paper, Button default, pickers) | **18px** |
| Outlined inputs | **12px** |
| Pill buttons / chips / scrollbar thumb | **999px** |
| Picker day, clock item, arrow buttons | 10px |
| Login button | 16px |
| Switch track | 13px |
| Page panel | ~24px · cards ~20px (observed) |

## Shadows
| Token | Value |
|---|---|
| `shadow.sm` | `0 10px 22px rgba(15,23,42,0.06)` |
| `shadow.md` | `0 20px 45px rgba(15,23,42,0.08)` (popovers, pickers) |
| `shadow.card` | `0 10px 30px rgba(15,23,42,0.08)` |
| `shadow.cardLarge` | `0 16px 34px rgba(15,23,42,0.06)` |
| `formModal.shadow` | `0 10px 40px rgba(15,23,42,0.25)` |
| `ds.menuShadow` | `0 8px 24px rgba(15,23,41,0.10)` |
| `ds.dragShadow` | `0 8px 18px rgba(15,23,41,0.14)` |
| Buttons | `disableElevation: true` (flat) |

## Spacing
MUI default 8px unit (`theme.spacing`). Observed paddings: buttons `0.7rem 1.25rem`, inputs `14px`, helper text margin `3px 14px 0`.

## Breakpoints
MUI defaults (xs 0, sm 600, md 900, lg 1200, xl 1536). Grid usage is mostly `xs:12` → `md:6` / `md:4` / `md:3`; `breakpoints.up("sm")` and `down("lg")` are used sparingly.

## Component overrides (`45718`)
- `MuiButton`: radius 18, padding `0.7rem 1.25rem`, `disableElevation`. Pages also use 999px pills via `sx`.
- `MuiTextField`: `variant="outlined"`, `fullWidth`.
- `MuiOutlinedInput`: radius 12. Border `border.subtle`, hover `border.dark`, focus `primary.main` 1px. Disabled bg `neutral.100` at opacity .7. Read-only bg `neutral.50`. Autofill is forced to a white background.
- `MuiInputLabel` (outlined): colour secondary. When shrunk, a white background with 4px inline padding.
- `MuiCheckbox`: unchecked `border.subtle`, checked `secondary.main`.
- `MuiPaper`: radius 18, border `1px border.dark`.
- `MuiInputBase`: `autoComplete="off"`.
- Date/time pickers: teal selected state, `surface.tealLight` hover, 10px items, Poppins.
- Toasts: notistack, anchored **bottom-left**, enter 225ms and exit 195ms, variants success, error and warning.
