# Confirmation popups (vertical and practice level)

Captured 2026-10-27 as super-admin. Each popup was opened and then closed with **Cancel / Go Back**. A page-level guard blocked every non-GET request during the session; it recorded **zero** blocked writes, and the network log shows only GET calls. Popups that couldn't be reached on screen were read from the app code and are marked **(code)**.

## The five dialog designs in use
The app has no single confirm component. Five designs are in use:

| # | Design | Used by | Width | Radius | Buttons |
|---|---|---|---|---|---|
| A | **Shared `ConfirmDialog`** (practice level): tinted icon tile + title + auto subtitle, ✕ in a grey square, body, optional warning/alternative callouts, footer with right-aligned buttons | Archive patient, Delete Rota Template, Delete Assignment, Claim/Decline Shift, Delete policy | 520px | 24px | Outlined Cancel (white, r24) + filled confirm (r24) |
| B | **Delete Role** dialog: red ⓘ circle + title + question, pink warning box, per-user reassign card | Delete Role | ~580px | 36px | Full-width pair: outlined Cancel (r360, dark border) + Delete Role (grey while disabled) |
| C | **Template action dialog**: title + text only, no ✕, no icon | Delete Template, Mark as Inactive, Activate Template | 600px | 18px | Full-width pair, r18: outlined Cancel + red / cyan confirm |
| D | **Settings dialog** (`G.ED` kit): title + ✕, text, left/right buttons | Delete Competency | 640px | 14px, 40px padding | Outlined Cancel (r100) left, red "🗑 Delete Competency" right |
| E | **Feature one-offs**: their own layouts | Leave Approve/Reject (600/24), Cancel/Reschedule Appointment (600/24), Mark as Completed/DNA (code), Lock User (636/16), Cancel Leave (code), Archive Practice (code), Move to Standard (900/18) | — | — | — |

### A. Shared `ConfirmDialog` (practice level)
Props (code): `open, title, message, warning, alternative, subtitle, onClose, onConfirm, confirmButtonText="Confirm", cancelButtonText="Cancel", confirmButtonDisabled, confirmButtonVariant="error" | "warning" | "success" | "primary", confirmButtonLoading, zIndex`.
- **Header row:** 36px tinted square icon tile (error/warning: `error-warning-line`; success: `checkbox-circle-line`; primary: `question-line`), **title** (bold ~18px) and, under it, a small grey subtitle. If the variant is `error` and the confirm text starts with "Delete" or "Remove", the subtitle is filled in automatically: **"This can't be undone."** The ✕ is a 32px grey square (`#F0F1F3`, 16px radius, navy icon), `aria-label="Close"`.
- **Body:** message text. Optional **warning** callout (tinted box with ⚠ icon, warning or error tone) and **alternative** callout (archive icon, primary tone).
- **Footer:** divider above, buttons right-aligned. Cancel is outlined white with a dark border (radius 24px). Confirm is filled in the variant colour (error `#D32F2F`, warning `#F97316`, success, primary), radius 24px, with an icon.
- **Behaviour:** the **confirm button gets focus 50ms after opening**, and **Enter anywhere confirms** (except in inputs, on Cancel or on ✕). While `confirmButtonLoading`, backdrop and ✕ can't close it.
- `aria-labelledby` (title) and `aria-describedby` (message) are set.

## Vertical level (super-admin)

### Delete Role: `/verticals/public/roles`, trash icon on a row
Design B. Captured for **HR** (1 user assigned).
- Red outlined ⓘ in a pink circle · **Delete Role** · "Are you sure you want to delete the role **"HR"**?"
- Pink warning box (`#FEF2F2`-ish, red text): ⓘ "Warning: **1 user(s)** are assigned to this role." / "Please reassign these users to another role before deleting."
- One grey card per assigned user: **name** (bold) · email · **`Reassign User To Role *`** autocomplete. Options are the other roles: Care navigator, Clinician, Nurse, Practice Manager (the role being deleted is excluded).
- Footer: **Cancel** (outlined, dark `#1F2933` border, pill) · **Delete Role** (`#D1D5DB` grey with white text while disabled; it stays disabled until every user is reassigned).
- ✕ top right (40px round icon button, `aria-label="Close"`). **Esc closes the whole dialog**, even from inside the open autocomplete.
- Copy from code: loading "Checking associated users...", success toast "Role deleted successfully", errors listed in `docs/super-admin/05-roles-and-permissions.md`.

### Template Library: `/verticals/public/templates`, ⋮ menu on a card
Menu items depend on scope and status:
- Standard, Active: View Details · Edit Template · **Mark as Inactive** · **Delete Template**
- Standard, Inactive: View Details · Edit Template · **Activate Template** · Delete Template
- Staff-created: View Details · **Move to Standard** · Delete Template

Design C, 600px, 18px radius, no ✕, no icon:

| Popup | Title | Body | Extra | Buttons |
|---|---|---|---|---|
| Delete | **Delete Template** | "This action cannot be undone. "{name}" will be permanently deleted." | — | Cancel · **Delete Permanently** (`#DC2626`) |
| Deactivate | **Mark Template as Inactive** | ""{name}" will be moved to inactive status. Staff will no longer be able to use this template." | Amber callout (`#FFF4E5` bg, `#8A5300` text, 18px radius, ⚠): "You can reactivate this template anytime from the Template Library." | Cancel · **Mark as Inactive** (red) |
| Activate | **Activate Template** | ""{name}" will be activated and made available to staff." | — | Cancel · **Activate** (cyan `#5CE1E6`, dark-teal text `#255A5C`) |

Success toast after moving: "Template moved to Standard Templates successfully."; error "Failed to move template to Standard Templates."

**Move to Standard Templates** (a review form, not a plain confirm): 900px (`maxWidth: md`), 18px radius.
- Title "Move to Standard Templates" · "Review and refine this staff-created template before making it available across the vertical."
- Grey **Original template** box: Author, Category, Type, Subject, Body (placeholders like `{{patient_name}}` shown in blue).
- **Standard template details:** `Template Name *` · `Category *` (select) · `Subject *` (email only) · `Template Body *` with "Character limit: 68/1000".
- Footer (divider above, right-aligned): **Cancel** (outlined pill) · **Move to Standard** (cyan pill).

### Settings → Competency: `/verticals/public/settings?section=competency`, red trash on a row
Design D. **Delete Competency** + ✕ · "Are you sure you want to delete **"{name}"**? This action cannot be undone." · Cancel (outlined pill, left) · **🗑 Delete Competency** (red pill, right). 640px wide, 14px radius, 40px padding. ✕ and Cancel are disabled while deleting.
- Row tooltips: "Edit" / "Delete", or **"Can be edited via vertical settings"** / **"Can be deleted via vertical settings"** when a practice-level row was defined by the vertical (buttons disabled).

### Settings → Pathway Configuration
No confirmations. The only row action is **Configure {pathway}**, which opens the pathway page.

### Archive Practice **(code; not reachable on screen)**
`ArchiveConfirmModal` exists, but the practice list passes `onArchivePractice: undefined` and `showArchivedTab: false`, so there's no Archive button anywhere.
- 24px radius, white, padding 32px (24 on mobile), `maxWidth: sm`. **Backdrop click and Esc are both disabled.**
- 56px orange-tint circle (`rgba(239,108,0,.08)`) with `/archive_icon.svg`.
- **Reason Of Archiving** (h2, 24px, bold).
- Bullets: "The practice **{name}** will be moved to **archived status** immediately." · "You will retain **read-only access** to its historical data." · "You can **restore the practice** at any time from the Practice settings section."
- **Will you help us learn why?** (20px bold) and a radio group (cyan `#5CE1E6` radios): "The practice is no longer operational." (default) · "The data is no longer needed actively." · "We've merged with another practice." · "Other". **Other** reveals `Reason` (textarea, "Tell us why", max 500, helper "{n}/500 characters").
- Footer: full-width **Cancel** (outlined) + **Archive Practice** (contained).
- Confirm only hides the row on the client (`clientArchivedIds`) and refetches. **No archive API call is made**, and the reason isn't sent anywhere.

## Practice level (Main Practice - Surgery)

### Leaves: Approve / Reject (`/leave-management`, Leave Requests row)
Design E, 600px, 24px radius. Title (h6 bold) + subtitle "{staff} — {leave type}" + ✕ (**no aria-label**).
- **Approve Leave Request:** "Approve a pending leave request." · Cancel (outlined pill) · **✓ Approve** (green `#16A34A`).
- **Reject Leave Request:** `Reason (Optional)` textarea (placeholder "State reason of rejection here...", max 300, counter `0/300`) · Cancel · **✕ Reject** (red `#DC2626`).
- Buttons sit at opposite ends (space-between); on mobile they stack with Cancel underneath.

### Leaves and ROTA: Cancel leave request **(code; no pending request of your own)**
Title "Cancel Request". Icon, **Cancel this leave request?**, "This will withdraw your pending request. Your manager will no longer be able to approve or reject it. This action cannot be undone." A summary box shows type and "{start} – {end} · {duration}". Buttons: **Keep Request** · **Cancel Leave** (red). Toasts: "Leave request cancelled." / "Unable to cancel leave request. Please try again."

### Patients: Archive patient (`/patient-management`, row "Archive {name}")
Design A, `warning` variant. **Archive patient** · "Archive {name}? They will be moved out of the active patient list." · warning callout "Archived patients can no longer be managed from this list." · Cancel · **Archive** (orange `#F97316`). Focus lands on **Archive**. Toasts: "Patient archived." / "Failed to archive the patient".

### Appointment (`/appointment`, appointment detail popup)
The detail popup (opened with 👁) has **Join Appointment · Reschedule · Cancel Appointment**. Each opens a second dialog on top (600px, 24px radius), with an icon tile top-left and ✕ top-right:
- **Cancel Appointment:** red ⓘ · "Are you sure you want to cancel this appointment?" · **`Reason *`** textarea (placeholder "Type description here", 4 rows) · "Character limit: 300" · full-width **Go Back** (outlined pill) + **Yes Cancel** (grey/disabled until a reason is typed, then red).
- **Reschedule Appointment:** "Are you sure you want to reschedule this appointment? The patient will be asked to choose a new time." · **Go Back** · **Yes Reschedule** (cyan `#5CE1E6`, dark-teal text).
- **(code)** status confirms on booked appointments:
  - **Mark as Completed:** "Are you sure you want to mark this appointment as **Completed**?" + "This confirms that the patient attended and the appointment took place. The appointment status will be updated and any associated workflows (such as clinical notes, follow-up, or reporting) will be triggered." → **Yes, Mark as Completed**
  - **Mark as Do Not Appear (DNA):** "…did not attend the appointment… may be affected." → **Yes, Mark as DNA**

### Staff on-boarding (`/staff`, Staff List row actions)
- **Lock User Profile** (Lock user 🔒; only on Active rows): 636px, 16px radius, **blurred backdrop** (the only blurred one). Red lock icon tile · title · grey user card (initials avatar, name, "{role} • {practice}", email) · three lines: "Are you sure you want to lock this user's profile?" / "Locking this user will immediately revoke their access to the platform." / "They will no longer be able to access this business until their access is restored." · blue info callout "This action can be reversed by unlocking the user at any time." · full-width **Cancel** (outlined pill) + **Lock User** (`#D32F2F`).
- **Archive staff:** the button is **hard-coded `disabled`** in the code, so there's no popup.
- Pending rows show **Approve / Reject** outlined buttons. Resend invite (sent invitations) acts straight away with no confirm.

### ROTA Management (`/rota`)
- **Delete Rota Template** (Apply Rota Template → Choose Rota Template popup → 🗑 on a template): Design A, error. Subtitle "This can't be undone." **and** body "Are you sure you want to delete this rota template? This action cannot be undone." (the same sentence twice). Cancel · **🗑 Delete** (`#D32F2F`). Focus lands on Delete. Opens above the template popup (`zIndex 1400`).
- **Delete Assignment** (open a shift → Edit Assignment drawer → red 🗑 next to the assigned staff): Design A, error. "Are you sure you want to delete this assignment? This action cannot be undone." · Cancel · **🗑 Delete**.
- **Shift Bidding (code; no open shifts):** "Claim Shift" ("Are you sure you want to claim this shift?" → **Claim**, primary) · "Decline Shift" ("Are you sure you want to decline this shift opportunity?" → **Decline**, error) · "Accept Bid" (`maxWidth: xs`): "Are you sure you want to accept this bid from {staff} at £{amount}? This will assign the slot to them." → **Accept Bid** (green).
- **Apply template (code):** checkbox "Clear existing shifts before applying template", with a tooltip warning that all shifts in the date range will be deleted. There is no separate confirm step.

### HR Policies: Delete policy **(code; library is empty)**
Design A, error. **Delete policy?** · ""{title}" and all its versions will be removed from the library, and the assistant will stop answering from it." · **Delete**. Toasts: "Policy deleted." / "We couldn't delete this policy."

## Issues found
- **Five different confirm-dialog designs.** Radii are 14 / 18 / 24 / 36px, widths 520–640px, and buttons are full-width in some and right-aligned in others. Rebuild them as one `ConfirmDialog`.
- **The shared ConfirmDialog focuses the destructive button, and Enter confirms.** One accidental Enter archives a patient or deletes an assignment. Focus should start on Cancel.
- **"This can't be undone." appears twice** on Delete Rota Template and Delete Assignment (auto subtitle plus body text).
- **Archive Practice is unreachable** (no archive action is passed), and its confirm makes **no API call**: the row is only hidden on the client.
- **Archive staff is permanently disabled** (hard-coded), and the icon gives no reason or tooltip.
- **The Leave Approve/Reject ✕ has no `aria-label`.** Rota template edit and delete icons have no labels either.
- **The Choose Rota Template popup shows the browser's amber focus outline** around the whole dialog.
- **Rota templates listed in Main Practice belong to "Friary House Surgery"**, so templates aren't scoped to the current practice.
- **Edit Assignment loads the wrong date:** clicking Tue 27 Oct requests `date=2026-10-05` (confirms the "Mon, 5 Oct" bug).
- **Different cancel wording:** "Cancel", "Go Back", "Keep Request".
- **Different confirm wording:** "Yes Cancel" / "Yes Reschedule" (no comma) vs "Yes, Mark as Completed" (comma).
- **The appointment Cancel reason is required, but leave Reject reason is optional.** Their limits are both 300.
- **Lock User** is the only dialog with a blurred backdrop.
- **Delete Role:** Esc closes the whole dialog even when only the autocomplete is open, so any reassignments already picked are lost.
- **Mark as Inactive** uses a red (destructive) button although the action can be undone.
