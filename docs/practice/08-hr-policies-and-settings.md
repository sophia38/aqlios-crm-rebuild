# Practice · HR Policies, and practice Settings

Captured 2026-10-27 in **Main Practice - Surgery** as super-admin. Nothing was uploaded, asked or saved.

## 1. HR Policies
Routes: `/hr-policies/ask` (default) and `/hr-policies/library`. **Tabs are real routes.**
Breadcrumb `HRM / HR Policies / Ask HR` (or `/ Policy library`). Tab pills with icons: **Ask HR** · **Policy library** (active is dark teal).

### Ask HR (AI assistant)
- Card **Ask HR** / "Ask a question and get an answer from your practice's own policies, with sources."
- Empty state (no policies): sparkle icon in a grey circle · **Ask about your practice's HR policies** · "Your practice has no policies yet. Upload the staff handbook and HR policies so staff can ask questions here." · **☁ Upload a policy** (dark teal pill).
- **Suggested question chips** (outlined pills): "How much annual leave do I get?" · "What is the sickness reporting procedure?" · "How do I raise a grievance?" · "What is the expenses policy?"
- Composer: multiline "Ask a question about your policies" · helper "Enter to send, Shift+Enter for a new line" · counter `0/1000` · **▷ Send** (disabled while empty).
- Permission link: HR Policies › View Policies (ask) › Manage Policies (upload).

### Policy library
- Header button **☁ Upload policy** (top right, dark teal).
- Card **Policy library** / "The staff handbook and HR policies the assistant answers from."
- **Category filter chips** (single-select pills; active is mint with a teal border): All · Staff handbook · Leave · Sickness · Family leave · Expenses · Conduct & disciplinary · Grievance · Health & safety · Equality · Other.
- Empty state: document icon · **No policies yet** · "Upload your staff handbook and HR policies. Staff can then ask questions and get answers with the exact clause cited." · **Upload policy**.

### Upload policy popup
Centred dialog (~450px, 18px radius). **Upload policy** + ✕ (grey circle). "Add a PDF or Word document. The assistant can answer from it once it is ready."
- `Title *` · `Category *` (select; same list as the chips) · `Owner` (select, helper "Keeps this policy up to date.") · `Effective date` (**native browser date input** "dd/mm/yyyy") · `Description` (textarea)
- Dashed drop zone: ☁ "Drop a file here or **browse**", "PDF or Word (.docx), max 10 MB".
- Footer: **Cancel** (outlined) · **Upload** (dark teal, **enabled even when the form is empty**).

## 2. Practice Settings
Route `/settings` → **defaults to Competency**. Sections are **path routes** (`/settings/{section}`), unlike vertical Settings, which uses `?section=`.
- No page header, breadcrumb or ⚙ title (the vertical Settings has them). Top bar "⚙ Settings".
- Left nav card (white, floating shadow): Appointment Configuration · Competency · Pathway Configuration · Practice Profile · Templates. The active item is a bold pill with a light border.

| Section | Route | What's there |
|---|---|---|
| Appointment Configuration | `settings/appointment-configuration` | Same form as vertical "Global Appointment Configuration" (`docs/super-admin/09-settings.md`), with practice values: open slots within **2 hours**; SMS **No reminder** (helper "No SMS reminder is sent to patients."); Email **Before 2 Hours**; Same Day Booking **Allowed**; Urgent/Routine "Admin Staff"; Urgent Capacity Threshold days; Extra Appointment. Subtitle "Manage Appointment settings here." Cancel / Save Changes. |
| Competency | `settings/competency` | Same as vertical Competency (table + Add Competency drawer). Practice data has 6 types incl. "test practice 2 comptenecy", "Respiratory" ("asthama"), "practice level", with roles like "EMIS Clinician", "Furqan Nurse". |
| Pathway Configuration | `settings/pathway-configuration` | Same as vertical, plus a **Source** column: **Same as Hub** / **Custom** (practice override of a hub pathway). Counts differ from hub (e.g. Administrative 3 of 5 active, Men's Health 1 of 1). |
| Practice Profile | `settings/practice-profile` | **Placeholder**: "We are currently building the public practice profile management system. Soon you will be able to view and manage your practice profile details here." COMING SOON |
| Templates | `settings/templates` | Same Template Library UI as vertical (`docs/super-admin/10-template-library.md`). Shows **the same 27 templates** as the hub. |

## Issues found
- **Practice Settings opens on Competency**, the second nav item, not the first.
- **Different routing schemes** for Settings: `?section=` (vertical) vs `/settings/{section}` (practice).
- **Practice Profile** is a placeholder although each practice already has a profile form at vertical level.
- **Templates at practice level show all hub templates**, with no visible practice scoping.
- **Upload policy** uses a native date input and its Upload button is enabled with empty required fields.
- **Data typos** in dev competencies ("comptenecy", "asthama").
- **Copy:** "Manage Appointment settings here." (capital A).
