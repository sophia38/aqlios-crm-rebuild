# Super-admin · Practice View / Complete Practice Profile

Captured 2026-10-27 using **Croft Hall Medical Practice**. Nothing was saved.
Entry: 👁 **View** in the Practice Management table.
Route: `/verticals/public/hub-management/practices/practice-management/create/manual/complete-profile?practiceId={id}&subAppId={subAppId}`

> "View" is not read-only. It opens the same editable form as onboarding, plus an **Additional Configuration** area. Every practice opens here, whether its profile is complete or not.

## Table row hover (list page)
Hovering a row gives it a light grey background (`action.hoverLight` `rgba(0,0,0,0.04)`). Incomplete rows keep their peach tint.

## Layout
- Breadcrumb: `Practice Management / Practice Onboard Setup Method / Complete Practice Profile`. The middle crumb is dark, which suggests it's clickable; it points to a setup-method chooser page that hasn't been captured yet.
- `‹ Go Back`. Header: building icon, **Practice Information**, "Update practice information, upload your logo, and configure additional settings." On the right, **Save Changes**.
- **Logo block** (dashed box, logo already uploaded): an 80px framed logo thumbnail, a green ✓ **Saved** status, a **Change Logo** outlined pill and a 🗑 delete icon.
- **Collapsed by default** (unlike the onboard form): Practice Details, Address, Point of contact (with "Add Another POC"), Operating Hours. Fields are the same as in `03-onboard-new-practice.md`. The ODS search field is **not shown** here; Practice Name is edited directly.
- Divider with a centred grey pill label **"Additional Configuration"**.
- **Expanded by default**: the configuration sections below.

## Additional Configuration sections

### Rota groups (Optional)
- Helper: "Select one or more rota groups to associate with."
- Multi-select Autocomplete, label `Select Rota Group(s)`. Selected values are **teal-tint chips** with an ⓧ remove icon. Value: `Croft Hall Rota Group`.
- Data: rota groups for the sub-app. Empty: "No rota groups available."

### Linked Practices (Optional)
- Helper: "Select one or more practices from dropdown to link as a site."
- Multi-select Autocomplete `Select Practice(s)`, with chips. Value: `Main Practice - Surgery`.
- API: `POST .../public/v1/sub-apps/{subAppId}/practices/{id}/rota/same-rota-practices/` (a lookup that fires on load, not a save).

### Practice Succession Date
- `Start Date *` date picker (`DD/MM/YYYY`, 📅 icon, half width). Value `01/09/2026`.
- ☑ **Ongoing** checkbox (checked, teal). Unchecking it probably shows an End Date field, which hasn't been captured yet.

### Workforce Allocation Configuration (Optional)
- Repeating sub-card **Workforce Allocation N** (grey header, 🗑 delete, chevron). Three fields in a row (`md:4` each):
  | Field | Type | Options |
  |---|---|---|
  | Staff Type | Select | *Select staff type*, GP, ACP, FCP, Physiotherapist, ME, Nurse, NP, ANP, Pharmacist, Pharmacist technician, Prescription clerk, Reception, Administrative, MDT, Duty Team |
  | Frequency | Select | *Select frequency*, Daily, Weekly, Monthly |
  | Hours | Number | placeholder "e.g. 8", shown as `8.00` |
- Link button below: ⊕ **Add hours for another staff type** (teal text button).
- Value: GP · Daily · 8.00.

### Appointment Type Configuration (Mandatory)
- "(Mandatory)" is in red; "(Optional)" elsewhere is grey.
- **Warning alert** (peach bg `#FFF4E5`, ⚠ orange icon, brown text): "Only enabled appointment types will be available for booking. You must configure at least one appointment type as default."
- One bordered row per type: checkbox (enabled), name, and on the right either a **Default** chip (filled cyan `#5CE1E6`, dark text) or a **Set as Default** outlined pill.
  | Type | Enabled | Default |
  |---|---|---|
  | Face To Face Surgery | ✓ | **Default** |
  | Telephone Or Audio | | Set as Default |
  | Face To Face Home Visit | | Set as Default |
  | Written Including Online | | Set as Default |
  | Admin Work | ✓ (**locked**, faded checkbox) | none |
- Component: `ToggleOptionRow` (`label`, `enabled`, `onEnabledChange`, `isDefault`, `onSetDefault`, `locked`).
- API: `GET .../public/v1/sub-apps/{subAppId}/practices/{id}/clinical-system/appointment-configuration/`

### Slot Duration Configuration
- Repeating sub-card **Slot Duration N** (🕑 icon, chevron, no delete on the first one). Three fields:
  | Field | Required | Options / rules |
  |---|---|---|
  | Role | ✓ | *Select role*, Care navigator, Clinician, HR, Nurse, Practice Manager |
  | Appointment Type | ✓ | **Only the enabled appointment types** (here: Face To Face Surgery) |
  | Duration (minutes) | ✓ | number, placeholder "e.g. 15", helper "In minutes", digits only, max 5 digits, step 15, scroll wheel disabled |
- Value: Clinician · Face To Face Surgery · 30.
- ⊕ **Add another slot duration configuration**.
- Note: the Role label shows "Role * *" (double asterisk) in the accessibility tree.

### Appointment Booking Configuration
Two selects side by side:
| Field | Options (value → label) | Default |
|---|---|---|
| Urgent | `BOTH` → Both, `URGENT` → **Admin Staff**, `ROUTINE` → **AI Voice Agent** | Both |
| Routine | `ADMIN_STAFF` → Admin Staff, `AI_VOICE_AGENT` → AI Voice Agent, `BOTH` → Both | Both |

⚠ **Bug:** the Urgent list sends `URGENT`/`ROUTINE` values under the labels "Admin Staff"/"AI Voice Agent", while Routine uses `ADMIN_STAFF`/`AI_VOICE_AGENT`. The two lists also come in a different order.

### Urgent Capacity Threshold
- Inner bordered panel with a row per day, the same structure as Operating Hours. Sun Closed, Mon–Fri Open 08:00 to 18:30, Sat Closed.
- ⚠ The switch here is a **different style**: a small MUI switch in cyan `#5CE1E6`, not the iOS-style teal switch in Operating Hours.
- `Extra appointments` select (full width):
  | Value | Label |
  |---|---|
  | SIGNPOST_TO_PHARMACY | Signposting to Pharmacy (selected) |
  | REDIRECT_OOH_CLINIC | Redirecting to Out of Hours Clinic |
  | REDIRECT_NHS_111 | Redirecting to NHS 111 |
  | FORWARD_TO_AE | Forwarding patients to A&E |
  | CREATE_SAME_DAY_APPOINTMENTS | Creating additional same-day appointments |
- API: `GET .../practice-management/v1/sub-apps/{subAppId}/practice/{id}/sla-configuration` (note the singular `practice/` here, `practices/` elsewhere).

## APIs on load
- `GET .../practice-management/v1/sub-apps/{subAppId}/practices/{id}`: practice details
- `GET .../public/v1/.../practices/{id}/clinical-system/appointment-configuration/`
- `GET .../practice-management/v1/.../practice/{id}/sla-configuration`
- `POST .../public/v1/.../practices/{id}/rota/same-rota-practices/` (×2, lookup)

## Behaviour notes
- In this build, pressing Escape on a MUI Select doesn't always close the menu, and a click while it's still open selects an option. Watch for this when testing.
- A closed Select's options are only rendered while it's open. Appointment Type options depend on which types are enabled above.

## To capture
- [ ] Save Changes result (success toast and validation) — would change real data, so it needs your OK
- [ ] Unchecking Ongoing (End Date field?)
- [ ] Set as Default / disable the default type (error when none is default)
- [ ] Remove a chip, remove a workforce allocation, delete the logo (confirm popup?)
- [ ] "Practice Onboard Setup Method" page (breadcrumb)
- [ ] An incomplete practice's profile (which fields are flagged)
- [x] Archive practice flow: read from code, not reachable on screen. See `docs/practice/09-confirmation-popups.md`
