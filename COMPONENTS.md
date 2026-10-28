# Aqlios component inventory

**Source:** the live app's compiled bundles and DOM (`crm.dev.aqlios.31g.co.uk`), captured 2026-10-27. There is no original source code. Component names below are **ours**, because the originals are minified. Props are the real prop names recovered from the bundles. **Paths are the locations in the rebuild**; the Status column says which are built.

Coverage: all routes captured in docs/. **Gallery:** every built shared component is shown at `/dev/components` (mock mode).

Previously: only routes visited so far (Verticals, Dashboard grid, Practice Management list, Onboard form, Login). Template Library, Roles, ROTA, CQC, System Feed, Notifications and Settings are **not yet inventoried**, so expect additions.

Status: `observed` = seen rendered on a page · `bundle-only` = found in the bundle, not yet seen on screen. · `**built**` = implemented in this repo.

All components use MUI (`@mui/material`) with `sx` styling and the theme in `src/theme/`. See `docs/design-tokens.md`.

---

## Primitives
Thin wrappers or theme overrides around MUI. Prefer the MUI component with the theme over a new wrapper.

| Component | Purpose | Key props / variants | Path | Status |
|---|---|---|---|---|
| `Button` (MUI, themed) | All buttons | `variant="contained"` = teal pill (primary) · `variant="outlined"` = outlined pill (Browse File, Refresh, Add Another POC) · `startIcon` | MUI + `src/theme/theme.ts` | observed |
| `TextField` (MUI, themed) | Text inputs | always outlined, fullWidth, 12px radius, floating label, `required`, `error`, `helperText` | MUI + theme | observed |
| `Switch` (themed) | On/off toggles (operating hours) | iOS style, teal track when on | `src/components/forms/AppSwitch.tsx` | **built** (phase 3) as `AppSwitch` |
| `AppIcon` | Renders an SVG icon by name or src | `icon`, `color`, `size` | `src/components/primitives/AppIcon.tsx` | bundle-only |
| `BrandLogo` | Aqlios logo; also used for "QuantumLoopAI" | `src`, `size`, `width`, `height`, `color`, `sx` | `src/components/primitives/BrandLogo.tsx` | **built** (phase 1) |
| `EntityAvatar` | Practice logo or initials circle | `name`, `logoSrc`, `size`, `borderRadius`, `framed`, `sx` | `src/components/primitives/EntityAvatar.tsx` | **built** (phase 2) |
| `LoadingSpinner` | Spinner with optional message | `message` (default "Loading..."), `fullScreen`, `size`, `thickness`, `color` | `src/components/feedback/LoadingSpinner.tsx` | **built** (phase 1) |
| `StepIndicator` | Numbered step dot | `index`, `isCompleted`, `isUpcoming`, `size` | `src/components/primitives/StepIndicator.tsx` | bundle-only |
| `GoBackLink` | "‹ Go Back" text button | `onClick`, `children` | `src/components/primitives/GoBackLink.tsx` | **built** (phase 2) |

```tsx
<Button variant="contained" startIcon={<AddCircleOutline />}>Onboard New Practice</Button>
<Button variant="outlined" startIcon={<Refresh />}>Refresh</Button>
<EntityAvatar name="Ashcroft Surgery" logoSrc={practice.logo} size={44} />
<LoadingSpinner message="Loading practices..." />
```

## Composed components

| Component | Purpose | Key props / variants | Path | Status |
|---|---|---|---|---|
| `FormSectionCard` | Collapsible white card for one form section, with a red border on error | `title`, `iconSrc`, `hasError`, `sx`, `children` (header can hold actions such as "Add Another POC") | `src/components/forms/FormSectionCard.tsx` | **built** (phase 3): also `expanded`/`onExpandedChange`, `actions` |
| `CollapsibleAccordion` | Styled MUI Accordion used inside sections | `minHeight`, `py`, `size`, `sx` | `src/components/forms/CollapsibleAccordion.tsx` | not built: `FormSectionCard` and `RepeatableItemCard` cover it |
| `LogoUploadDropzone` | Dashed drag-and-drop logo upload with Browse File | `variant`, `uploadedLogo`, `setUploadedLogo`, `setFileError`, `onRemoveLogo`, `subAppId`. Error: "Logo upload failed. Please try again." | `src/components/forms/LogoUploadDropzone.tsx` | **built** (phase 3): props `value`, `onUpload`, `onChange`, `practiceName`; JPEG or PNG ≤10MB |
| `PracticeManagerSelect` | Autocomplete of managers (name and email), paged 10 at a time | `value`, `onChange`, `onBlur`, `label`, `placeholder`, `disabled`, `error`, `helperText`, `sx`. Empty: "No managers found" | `src/components/forms/PracticeManagerSelect.tsx` | **built** (phase 3): `value` is the manager id; loads 10 per page on scroll |
| `OdsPracticeSearch` | Type-ahead over NHS ODS practices that autofills the form | Formik field. Empty: "No practices found. Try another search." | `src/components/forms/OdsPracticeSearch.tsx` | **built** (phase 3): controlled `inputValue` so "required" works without a selection |
| `PhoneField` | Phone input with country picker (UK only, searchable) | Formik field. Empty: "No countries found" | `src/components/forms/PhoneField.tsx` | **built** (phase 3) |
| `OperatingHoursRow` | One day: switch, Open/Closed and from/to HH:mm | `dayKey`, `label`, `hours`, `dayError`, `dayTouched`, `submitCount`, `hoursFrozen`, `toggleDay`, `dayTimeDrafts`, `handleDayTimeTextChange`, `handleDayTimeTextBlur`, `adjustDayTimeByHours`. Error: "Start time cannot be after end time" | `src/components/forms/OperatingHoursRow.tsx` | **built** (phase 3): props `dayKey`, `label`, `hours {open, from, to}`, `onChange`, `error`; 24-hour `TimeField` |
| `DateField` | Formik-bound date input (YYYY-MM-DD) | `name`, `label`, `formFieldStyles`, `submitCount` | `src/components/forms/DateField.tsx` | bundle-only |
| `ToggleOptionRow` | Enable/disable an option, set default, optionally locked | `label`, `enabled`, `onEnabledChange`, `isDefault`, `onSetDefault`, `locked` ("Default" / "Set as Default") | `src/components/forms/ToggleOptionRow.tsx` | **built** (phase 3) |
| `RotaGroupSelect` | Select a rota group for a practice | `subAppId`, `currentPracticeId`, `staffPracticeId`, `value`, `onChange` ("Loading...", "No rota groups available.") | `src/components/forms/RotaGroupSelect.tsx` | **built** (phase 3): props `subAppId`, `value` (ids), `onChange` |
| `PracticeListToolbar` | Title row, Onboard button and name search above the table | `search`, `onSearchChange`, `onOnboardNewPractice`, `title`, `subtitle`, `onboardButtonLabel`, `searchFieldLabel`, `searchFieldFullWidth`, `hideTitleRow`, `embeddedOnGreySurface`, `managerFilter` | `src/components/practice/PracticeListToolbar.tsx` | **built** (phase 3): props `title`, `search`, `onSearchChange`, `searchFieldLabel` |
| `PillTabs` | Pill-button tab row (active is teal filled, others outlined) | `activeTab`, `onChange`, `showArchivedTab` → "Practice List" / "Archived Practice" (business variant: "Business List") | `src/components/navigation/PillTabs.tsx` | **built** (phase 2): `tabs`, `value`, `onChange`, `aria-label` |
| `ViewModeToggle` | List/Grid icon toggle (`role=tablist`) | `value`, `onChange` | `src/components/navigation/ViewModeToggle.tsx` | **built** (phase 2) |
| `HubCard` | Grid card: avatar, divider, name and ↗ button | `hub`, `label`, `onSelect`, `disabled` (aria "Open business") | `src/components/practice/HubCard.tsx` | **built** (phase 3): props `name`, `logoSrc`, `onSelect`, `disabled` |
| `VerticalCard` | Lightbulb card on `/verticals` | `label`, `onClick`, `logoSrc`; disabled = faded | `src/components/practice/VerticalCard.tsx` | **built** (phase 1) |
| `DataTable` | MUI Table with sortable headers, row states and `TablePagination` | columns, rows, `ordering`, `onSortChange`, `page`, `rowsPerPage`, `totalCount`, `onPageChange`, `onRowsPerPageChange`, `getRowState` (e.g. incomplete) | `src/components/data/DataTable.tsx` | **built** (phase 2) |
| `ResultListWithPagination` | List with pagination and a "Go to Dashboard" action | `items`, `onGoToDashboard`, `actionLabel`, `page`, `rowsPerPage`, `totalCount`, `onPageChange`, `onRowsPerPageChange` | `src/components/data/ResultListWithPagination.tsx` | bundle-only |
| `ArchiveConfirmModal` | Confirm archive with a reason | `open`, `practiceName`, `entityLabelSingular`, `onClose`, `onConfirm` ("Reason Of Archiving") | `src/components/modals/ArchiveConfirmModal.tsx` | bundle-only (not reachable on screen; see `docs/practice/09-confirmation-popups.md`) |
| `ConfirmDialog` | The one confirm for delete, archive, claim and status changes (replaces the 5 live variants) | `open`, `title`, `message`, `warning?`, `alternative?`, `subtitle?`, `confirmButtonText`, `cancelButtonText`, `confirmButtonVariant` (`error`, `warning`, `success`, `primary`), `confirmButtonLoading`, `confirmButtonDisabled`, `onClose`, `onConfirm` | `src/components/modals/ConfirmDialog.tsx` | **built** (phase 2) |
| `OnboardHubModal` | Choose how to onboard a hub (Public/Private) | `open`, `onClose`, `hubType` | `src/components/modals/OnboardHubModal.tsx` | bundle-only |
| `UserMenu` | Header user pill (avatar, name, role, chevron) | user, role | `src/components/layout/UserMenu.tsx` | **built** (phase 1): Logout + demo role switch and reset |
| `TemplateCard` | Template card: type and status chips, ⋮ menu, name, subject, body preview with blue placeholders, created-by and date | `template`, `onAction`, `actions` | `src/features/templates/components/TemplateCard.tsx` | observed |
| `RichTextEditor` | Message editor: formatting toolbar, Insert Placeholder menu, Ask AI, character counter | `value`, `onChange`, `placeholders`, `maxLength`, `onAskAi`, `readOnly` | `src/components/forms/RichTextEditor.tsx` | observed |
| `MessagePreview` | Phone-style preview of a message with sample data | `practiceName`, `body`, `emptyText` | `src/features/templates/components/MessagePreview.tsx` | observed |
| `ActionMenu` | ⋮ icon button opening a menu of icon and label items; destructive items in red, warning items in orange | `items: {label, icon, tone, onClick}[]` | `src/components/navigation/ActionMenu.tsx` | **built** (phase 2) |
| `FormDrawer` | Right-side drawer form: 480px, labels above fields, sticky Cancel and Save footer. Reference: Add Competency | `open`, `title`, `subtitle`, `onClose`, `onSubmit`, `submitLabel`, `children` | `src/components/modals/FormDrawer.tsx` | **built** (phase 2): also exports `FieldLabel` (bold label above a field) |
| `SettingsShell` | Settings layout: left section nav (via `?section=`) and content card | `sections`, `active`, `children` | `src/components/layout/SettingsShell.tsx` | observed |
| `GroupedDataTable` | Table with collapsible group header rows ("N of M active") and inline switch columns | `groups`, `columns`, `onToggle` | `src/components/data/GroupedDataTable.tsx` | observed |
| `FormModal` | Standard dialog: 600px, 16px radius, title with ✕, intro text, fields, Cancel and submit footer. Reference: Create Rota Group | `open`, `title`, `subtitle`, `onClose`, `onSubmit`, `submitLabel`, `submitIcon`, `submitDisabled`, `children` | `src/components/modals/FormModal.tsx` | **built** (phase 2) |
| `PermissionTree` | Accordion per module with "N / M permissions selected", indented child permissions, ✅/❌ in view mode, "Select all N" in edit mode, and search | `catalog`, `selected`, `onChange`, `mode` (`view` / `edit`), `search` | `src/features/roles/components/PermissionTree.tsx` | observed |
| `StatusChip` | Small pill status (Active, Inactive, Pending Invite, —) | `status`, `variant` (`soft` / `outlined`) | `src/components/data/StatusChip.tsx` | **built** (phase 2): one status → one colour map |
| `StatsStrip` | Grey strip of KPI numbers with coloured left bars | `items: {label, value, color}[]` | `src/components/data/StatsStrip.tsx` | observed |
| `ActivityCard` | Staff activity summary: name, date, status chip, label/value rows | `staff`, `date`, `status`, `rows` | `src/features/rota/components/ActivityCard.tsx` | observed |
| `CapacityCard` | Practice or staff card in the ROTA side panel: hours and weekly capacity bar | `title`, `subtitle`, `hours`, `assigned`, `total`, `chip`, `selected` | `src/features/rota/components/CapacityCard.tsx` | observed |
| `RotaLegend` | Session, duty and gap legend with colour squares | `groups` | `src/features/rota/components/RotaLegend.tsx` | observed |
| `WeekCalendarGrid` | Day/week grid in 30-minute rows, today tint, now-line, "Assign Staff" slots | `days`, `range` (`day` / `week`), `events`, `onSlotClick` | `src/features/rota/components/WeekCalendarGrid.tsx` | observed |
| `FilterBar` | Row of small outlined selects (13px), Clear filters, Refresh and search | `filters`, `values`, `onChange`, `onClear`, `onRefresh`, `search` | `src/components/data/FilterBar.tsx` | **built** (phase 2) |
| `SegmentedTabs` | Pill container with icon tabs; active is teal filled (ROTA top tabs, Practice/Staff view, Day/Week) | `items`, `value`, `onChange`, `size` | `src/components/navigation/SegmentedTabs.tsx` | **built** (phase 2): `tone`: `primary` (dark teal) or `brand` (cyan) |

```tsx
<FormSectionCard title="Address" iconSrc="/practice/location_practice_icon.svg" hasError={!!errors.address}>
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 6 }}><TextField name="address_line_1" label="Address Line 1" required /></Grid>
  </Grid>
</FormSectionCard>

<DataTable
  columns={practiceColumns}
  rows={practices}
  ordering="-created_at"
  page={page} rowsPerPage={10} totalCount={155}
  getRowState={(r) => (r.isIncomplete ? 'incomplete' : undefined)}
/>
```

## Layouts

| Component | Purpose | Key props | Path | Status |
|---|---|---|---|---|
| `AppSidebar` | Navigation drawer: sections, items, footer, user card. Collapsible. | `variant` (public/private), `sections`, `footer`, `activeItemId`, `isSectionOpen`, `onToggleSection`, `collapsed`, `onToggleCollapsed`, `user`, `logoSrc`, `onNavigate`, `belowHeader` | `src/components/layout/AppSidebar.tsx` | **built** (phase 2): `variant`: `drawer` (vertical ☰; practice level below md) or `persistent` (practice level, collapsible, state persisted) |
| `VerticalShell` | Page shell: floating header (☰, Back to Verticals, logo with vertical label, 🔔, UserMenu), sidebar drawer, content | `children` | `src/components/layout/VerticalShell.tsx` | **built** (phase 2): no ☰ / Back to Verticals for practice users |
| `HubManagementLayout` | Breadcrumbs plus grey rounded page panel | `hubManagementBreadcrumbs`, `children` | `src/components/layout/HubManagementLayout.tsx` | **built** (phase 2) |
| `ModulePageHeader` | Icon tile, title and subtitle, right-side actions | `icon`, `title`, `subtitle`, `actions` | `src/components/layout/ModulePageHeader.tsx` | **built** (phase 2) |
| `ComingSoonPlaceholder` | Placeholder for unbuilt modules: header plus a centred icon circle, title, message and "COMING SOON" pill | `title`, `icon`, `message` | `src/components/feedback/ComingSoonPlaceholder.tsx` | **built** (phase 1): centred body only; the header comes from the shell |
| `RouteErrorBoundary` | Next.js `error.tsx`: "Something went wrong" + Try again | `error`, `reset` | `src/app/**/error.tsx` | bundle-only |
| `LoadingBoundary` | Suspense wrapper | `loading`, `children` | `src/app/**/loading.tsx` | bundle-only |

```tsx
// src/app/verticals/[vertical]/hub-management/practices/page.tsx
<HubManagementLayout hubManagementBreadcrumbs={[{ label: 'Practice Management' }, { label: 'Practice List' }]}>
  <ModulePageHeader icon={<FolderShared />} title="Practice Management" subtitle="Practice List"
    actions={<Button variant="contained">Onboard New Practice</Button>} />
  <PillTabs activeTab="list" onChange={setTab} />
  <PracticeListToolbar search={q} onSearchChange={setQ} hideTitleRow />
  <DataTable ... />
</HubManagementLayout>
```

## Added during the rebuild
| Component | Purpose | Props | Path | Status |
|---|---|---|---|---|
| `AuthGate` | Wraps signed-in routes: loads `/api/auth/me` once, shows "Verifying session...", sends signed-out visitors to `/auth/login` and remembers where they were going | `children` | `src/components/auth/AuthGate.tsx` | **built** (phase 1) |
| `DevRoleSwitcher` | Mock mode only: "Sign in as" select on the login page, and Demo items in `UserMenu` (switch role, reset demo data). Renders nothing in live mode | `DevRoleSwitcherSelect { value, onChange }` · `DevRoleSwitcherMenuItems { onDone }` | `src/components/dev/DevRoleSwitcher.tsx` | **built** (phase 1) |
| `PracticeShell` | Practice-level frame: sidebar, top bar (page title, disabled 🔍, 🔔, switcher); below md the sidebar becomes a ☰ drawer | `basePath`, `practiceName`, `practicesHref`, `hasUnread`, `children` | `src/components/layout/PracticeShell.tsx` | **built** (phase 2, approved) |
| `PracticeSwitcher` | Top-bar pill with the current practice; menu: practice, Switch Practice, Logout | `practiceName`, `practicesHref` | `src/components/layout/PracticeSwitcher.tsx` | **built** (phase 2, approved) |
| `AccessDenied` | "You don't have access to this page" / not-found state with a way back (replaces the live silent redirects) | `title`, `message`, `backHref`, `backLabel` | `src/components/feedback/AccessDenied.tsx` | **built** (phase 2, approved) |
| `RepeatableItemCard` | Grey sub-card for one item of a repeating group: icon, "{Label} N", 🗑 (immediate, as live), collapse | `title`, `icon`, `onDelete?`, `hasError`, `children` | `src/components/forms/RepeatableItemCard.tsx` | **built** (phase 3, approved) |
| `PracticeForm` (feature) | Shared practice form: values, Yup schemas with the captured messages, ODS autofill, API mapping; `PracticeDetailsSections` (4 sections) and `AdditionalConfigurationSections` | see `src/features/practices/practiceForm.ts` | `src/features/practices/` | **built** (phase 3, approved) |

## Feedback patterns (no dedicated component yet)
- **Toasts:** `notistack` `enqueueSnackbar(msg, { variant: 'success' | 'error' | 'warning' })`, bottom-left.
- **Field errors:** Formik with Yup. Messages appear on blur and on submit, as MUI `helperText` in `error.main`.
- **Section errors:** `FormSectionCard hasError`.
- **Empty states:** a plain text line, for example "No practices found. Try another search." No illustrated empty-state component found.
- **Load errors:** "Failed to load …" messages shown as error toasts.
