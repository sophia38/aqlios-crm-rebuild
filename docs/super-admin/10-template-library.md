# Super-admin · Template Library (HUB)

Captured 2026-10-27. I didn't create, edit, deactivate, move or delete any template.
Route: `/verticals/public/templates`. The tabs don't change the URL.

## Layout
- No breadcrumb. Header: white circle tile with a document icon and **Templates Library** (bold, ~30px). No subtitle.
- One white bordered card holds everything:
  - **Communication Templates (27)** (bold, 18px).
  - **Pill tab switch**: `Standard Templates` | `Staff Created Templates`. The active tab is **cyan `#5CE1E6`** with dark teal text `#255A5C`; inactive tabs are grey text. Pill radius 72px, 38px high, 12px / 500.
  - Sub-header: 👤 icon and **Standard Templates (16)** / **Staff Created Templates (11)**. On the right, **⊕ Add Template** (cyan pill, 47px high, 90px radius, Standard tab only).
  - Filter row (labelled outlined fields), with `✕ Clear filters` (greyed until a filter is set).
  - Full-width **Template Categories** select (no label; it filters which category groups show).
  - **Category groups**: a bordered rounded box (18px radius) titled **Category (n)**, holding a **2-column grid of template cards**.

## Filters
| Tab | Filters |
|---|---|
| Standard | Search ("Search templates by name...", 🔍 start icon) · Type · Status |
| Staff Created | Search · Type · **Created By** · Status |

- Type: Message, Email, Note (the type chips).
- Status: Active, Inactive, Draft.
- Template Categories (also the Category field in the form): **Appointments, Prescription, Medicine, Payment, Consultation / Requests, Diet & Lifestyle, Documents, Blood Tests, Measurements & Vitals, Medical History**.

## Template card
- Light grey `#FAFAFA` card, rounded.
- Top row: **type chip** and **status chip** (both 22px high, 16px radius, 11px text), with a ⋮ menu on the right.
  | Chip | Text | Bg |
  |---|---|---|
  | Message | `#0288D1` | `rgba(2,136,209,0.04)` |
  | Note | `#0288D1` (same as Message) | same |
  | Email | `#9C27B0` | `rgba(156,39,176,0.04)` |
  | Active | `#16A34A` | `rgba(76,175,80,0.15)` |
  | Inactive | default text | `#F1F1F1` |
- **Template name** (bold).
- Email only: "Subject: …" (small grey).
- Body preview, about 2 lines with "…". **Placeholders like `{{patient_name}}` are shown in blue `#0288D1`.**
- Footer: "Created by {name}" (small grey) on the left and the date `DD/MM/YYYY` on the right.
- Staff Created only: an extra italic line "Business: Main Practice - Surgery".

### ⋮ menu
| Standard template | Staff created template |
|---|---|
| 👁 View Details | 👁 View Details |
| ✎ Edit Template | ⇪ Move to Standard |
| ⬤ **Mark as Inactive** (orange text) | 🗑 **Delete Template** (red) |
| 🗑 **Delete Template** (red) | |

For an inactive template the third item is probably "Mark as Active" (not checked).

## Data (dev)
- **Standard (16):** Appointments 5 · Prescription 2 · Medicine 1 · Payment 1 · Consultation / Requests 1 · Diet & Lifestyle 1 · Documents 1 · Blood Tests 1 · Measurements & Vitals 1 · Medical History 1. Seeded email templates are "Created by Aqlios Public Vertical Admin", dated 22/07/2026 (e.g. Appointment Reminder, Prescription Update, Medication Reminder, Payment Reminder, Blood Test Results).
- **Staff Created (11):** Appointments 1 · Prescription 3 · Medicine 1 · Payment 1 · Consultation / Requests 2 · Blood Tests 1 (…), by "Ali Emis - 201" and "Ali Emis Manager".

## Create Template / Template Details popup ⭐ (large form popup)
The same popup is used for create, view and probably edit.
- MUI Dialog, **almost full width (~1030px at a 1063px viewport)**, 18px radius, MUI elevation-24 shadow.
- Header: green document icon tile, **Create Template** / **Template Details** (bold), a small teal chip **Standard Template**, a subtitle and ✕.
  - Create subtitle: "Save reusable patient communication templates."
  - View subtitle: "View reusable patient communication template."
- **Template Details** card:
  - Subtitle "Create a reusable message template." (shown in **view mode too** ⚠)
  - Top right: a **status select** (outlined pill). Default **Draft**; options Active, Inactive, Draft.
  - `Template Name *` | `Category *` (two columns)
  - `Template Type *` radios: **Message (SMS / In-app)** (default) · **Email** · **Notes**. Email adds a Subject field.
  - `Template Message *`: a **rich-text editor**
    - Toolbar: Bold · Italic · Underline · Strikethrough | Link | Align left / center / right / justify | Bulleted / Numbered list | Decrease / Increase indent | Undo / Redo
    - On the right: **⊕ Insert Placeholder** (teal text) and **Ask AI** (white pill with a **rainbow gradient border**)
    - Placeholder: "Write your template message..."
    - Counter: "Character limit: 0/300"
  - **Insert Placeholder** menu: `{{patient_name}}`, `{{patient_dob}}`, `{{appointment_date}}`, `{{appointment_time}}`, `{{practice_name}}`, `{{service_name}}`, `{{doctor_name}}`, `{{clinic_name}}`, `{{clinic_phone}}`, `{{payment_amount}}`, `{{prescription_details}}`, `{{test_name}}`, `{{result_summary}}`
- **Preview** card: "See how your template will appear with sample data."
  - A phone-style mock: grey notch bar, practice avatar with "15 Sefton Road", and the message in a grey chat bubble.
  - Empty state: "Start typing to generate a preview."
- **Sticky footer**:
  - **Cancel** (outlined, left)
  - **Save as Draft** (outlined, right)
  - **Create Template** (filled, **disabled** until the form is valid)
- View mode: all fields are disabled and greyed, and the editor toolbar is hidden.
- Cancel closes immediately, with no "discard?" confirmation.

## Issues found
- **Message and Note chips are the same colour**, so you can't tell the types apart at a glance.
- The view-mode subtitle says "Create a reusable message template."
- **Dialogs show the browser's default focus ring** (`outline: auto` in amber/gold) around the whole popup when it opens. Focus styling hasn't been handled.
- Type is "Notes" in the radio but "Note" on the chip.
- The tab switch and Add Template button use cyan; the rest of HUB uses teal.
- This is a third popup size (near full width), alongside the 600px Rota Group popup and the 480px Competency drawer.
- The page title has no subtitle or breadcrumb, unlike Practice Management and Roles.
- Test data like "kk / jjo", "Test1212" and "Vitamin / t1" is mixed into the dev seed.
- No pagination: all groups render at once.

## To capture
- [ ] Ask AI behaviour (popup? inline generation?)
- [ ] Email type form (Subject field placement)
- [ ] Validation messages (name and category required, message over 300)
- [x] Mark as Inactive / Activate / Delete / Move to Standard confirmations. See `docs/practice/09-confirmation-popups.md`
- [ ] Edit mode
- [ ] Empty state for a category or search with no results
