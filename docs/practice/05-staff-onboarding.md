# Practice · HRM → Staff on-boarding (Staff Management)

Captured 2026-10-27 in **Main Practice - Surgery** as super-admin. No one was invited, imported, archived, locked or edited; both popups were cancelled.
Route: `/verticals/public/practices/{slug}/staff` (sidebar label "Staff on-boarding"; top bar shows "👥 Staff").

## Page structure
- Breadcrumb: `Staff Management` (underlined link) `/ Staff List` (changes per tab: "Sent invitations", "Archived Staff").
- **Tab pills** (white container): 👥 **Staff List** · 🕘 **Sent Invitations** · 🗄 **Archived Users**. The active tab is **dark teal filled** with white text. Tabs don't change the URL.
- White page card: **Staff List** (bold 20px). On the right, **⇧ Bulk Import Staff** (outlined teal pill) and **⊕ Invite Staff** (dark teal filled pill).

## 1. Staff List tab
### Stat cards (3 grey pills: icon circle, label, big number)
| Label (shown truncated ⚠) | Value | Colour |
|---|---|---|
| Total Staff | 55 | cyan/teal |
| Active St… (Active Staff) | 20 | green |
| Pending I… (Pending Invitations) | 34 | orange |

### Filters
- `Search` "Search by name or email"
- `Status`: All, Active, Inactive, Locked, Pending Invite, Invitation Expired, Resent Invite, Pending Profile, Pending Approval, Rejected
- `Staff Type`: All, GP, ACP, FCP, Physiotherapist, ME, Nurse, NP, ANP, Pharmacist, Pharmacist technician, Prescription clerk, Reception, Administrative, MDT, Duty Team
- `✕ Clear filters` (teal text) · `↻ Refresh` (outlined pill)

### Table
| Column | Content |
|---|---|
| Staff Name | name, email, phone (3 lines; name missing for some invites, so email shows first) |
| Staff Type | GP / ANP … |
| Practice | practice name (wraps) |
| Status | pill with tint: **Active** (green `#16A34A` on 15% green, ✓ icon) · **Resent invite** / **Invitation Expired** (red `#DC2626` on 15% red, ↻ icon, **underlined**: looks clickable, probably resends the invite) |
| Invited Date | `DD/MM/YYYY`, sortable ↓ |
| Actions | 👁 **View staff** · 🗄 **Archive staff** · 🔒 **Lock user** |

Pagination `1–10 of 55`.

## 2. Sent Invitations tab
- Title "Sent invitations" + **Invite Staff** button. Filters: Search, Staff Type (no Status), Clear filters, Refresh.
- Same table, showing invite rows only (Resent invite / Invitation Expired / …).
- API: `.../practices/{orgId}/staff?page=1&page_size=10&status=PENDING_INVITE`

## 3. Archived Users tab
- Title "Archived Staff". Filters: Search, Status, Staff Type.
- Empty state: **"No archived staff. Adjust your filters or search term."** Pagination `0–0 of 0`.
- API: `...staff?status=INACTIVE`

## 4. Send Invite popup (⊕ Invite Staff)
- Centred dialog (~460px, 18px radius). Title **Send Invite** + ✕. Subtitle "Invitation will be sent on the email to join the team."
- Fields: First Name | Last Name · Email · `Role *` (Select role) · `Staff Type *` (Select staff type).
- Footer: **Cancel** (outlined) · **➤ Sync with Clinical System** (dark teal, primary submit) ⚠ The label doesn't describe sending an invite.

## 5. Bulk Import Staff popup
- Dialog (~530px). Title **Bulk Import Staff** + ✕. Intro: "Import existing staff accounts in one go. After the import is complete, each staff member will receive an invitation to activate their account."
- **Step 1: Get the template** card: file icon, **aqlios_staff_import_template.xlsx**, "Includes column guidance, sample rows and the list of valid roles." and a **⇩ Download Template** (outlined pill).
- **Step 2: Upload your completed file \***: dashed drop zone with an upload icon, "Drag and drop your Excel file here, or **Browse**", "Supported format: .xlsx".
- Info alert (blue): "This import creates basic staff accounts only. Compliance documents (DBS, Right to Work, training) are added later by staff or HR."
- Footer: **Cancel** · **✓ Import Staff** (disabled until a file is chosen).
- API on open: `GET .../practices/{practiceId}/staff/bulk-import/`

## 6. Staff Member Details — `/staff/{staffId}`
- `‹ Back` · **Staff Member Details**.
- **Tabs**: Account Details · Leave Management · Compliance · Competencies · Payroll.
- Profile strip: avatar initials **MA**, **Muhammad Ali**, practice name, chip **No Rota Group**, and **Save Changes** (top right on every tab).

### Account Details (collapsible cards)
| Card | Fields |
|---|---|
| Personal Details | First Name* · Last Name* · Email* · Phone number* · Date of Birth* · Spoken Language |
| Professional Registration | National Performers List Number* (+ "Verification Status: Not Verified") · Registration number* (+ Not Verified) · PPA ID* · Smartcard Status* (**Waiting for Smartcard / Already Have Smartcard**) · Smartcard Number |
| Background & Identity Verification | National Insurance Number · DBS Certificate* (**Waiting for DBS / Already Have DBS**) · DBS Certificate Number (+ status "Awaiting DBS", "This staff member has not added a DBS certificate number yet.") · DBS Certificate Issue Date · DBS Level* (**Standard / Enhanced**) · DBS Update Service (**Yes / No**) |
| Address | Address Line 1* · Address Line 2 · City* · Postcode* |
| Emergency Contact | **Add Emergency Contact**; "Person 1 (Optional)": Name · Relationship · Phone number |
| Rota groups (Optional) | "Select one or more rota groups to associate with." multi-select |
| Contract Details | Start Date* ("Cannot be earlier than 20 years from today") · End Date ("Must be greater than Start Date and a future date"; disabled while **On Going SLA** ☑) · Contract Type* (**Locum Staff / Salaried Staff**) · grey sub-box "Locum Staff" with Duty Types* multi-select |
| Availability | Info alert: "Your work hours have been set by your practice administrator based on your role. Please note that break time is unpaid and does not count towards your paid working hours." · chip "🕘 Weekly Hours: 0 hrs" · Sunday→Saturday rows with switch (Closed) |
| Employment Record | Start Date · End Date · Leaving Reason (select, no options loaded) · helper "Used for HR Analytics headcount and turnover." |

### Leave Management tab
- **Annual Leave Entitlement**: Leave Type* · Duration* · Duration Type* (Weeks)
- **Sick Leave Entitlement**: Duration* · Duration Type* (Days)
- **Other Leaves Entitlement** ("No Fixed Entitlement"): 4 repeating rows of Leave Type · Duration · Unit (Weeks)

### Compliance tab
- **Compliance Verification** counters: Pending Verification 00 · Verified 00 · Rejected 00 · **Pending Upload 38** · Expired 00 (colours = `payrollStatus` tokens).
- Each document row shows: name (\* = required) · Uploaded Document · Date Added · Issue Date · (Re-verification Due) · Status chip (Pending Upload).
- Document groups:
  - **Identity & Personal Documents:** Proof of address 1\*, Proof of address 2\*, Proof of Identity\* (with a "Choose Document" select)
  - **CV & Employment History and References:** CV (10-year history with gap explanations), Reference 1 (Employment)\*, Reference 2 (Clinical)\*
  - **Qualifications:** Medical Qualifications (degree certificates), Certificate of Training (CCT/CEGPR/Foundation), Registration Certificate\* (re-verification), National Performers List Confirmation\* (re-verification)
  - **DBS and Compliance:** DBS Certificate\*, DBS Update Service Confirmation
  - **Indemnity & Insurance:** Indemnity Certificate (Expiry Date)
  - **Occupational Health:** Immunisation Record (Hep B, MMR, Varicella, BCG, HIV, Hep C)
  - **Mandatory Clinical Training Certificates** (each with Expiry Date): BLS / CPR & AED · Safeguarding Children – Level 3 · Safeguarding Adults – Level 3 · Infection Prevention & Control · Fire Safety Awareness · Health & Safety / Risk Assessment · Information Governance · Equality, Diversity & Human Rights · Manual Handling · Conflict Resolution / De-escalation · Mental Capacity Act & DOLS · Prevent · Lone Working / Personal Safety
  - **Recommended Clinical Training Certificates:** Anaphylaxis & Emergency Drugs · Vaccination & Immunisation Updates · Phlebotomy & Venepuncture · Chronic Disease Management · Wound Care & Dressings · Prescribing Governance / Medicines Management · Chaperone Training · Sepsis Recognition & Management · Mental Health Awareness / Suicide Prevention · Resilience & Stress Management · Cervical Screening Programme

### Competencies tab
- **Consultation Details**: `Inbox` select (Clinician) · `Staff Type` (GP) · **Age Groups** "Which age groups the staff members can see" checkboxes: 0-12 · 13-16 · Above 16 · 16-45 · 45+ ⚠ overlapping ranges.
- **Competency Mapping**: Search; warning text "Please ensure to discuss your competency mapping with your clinical leadership. The copy of the competency map will be sent to clinician, practice manager and clinical leadership team."; ☐ Select All.
- One row per competency (from Settings → Competency): "Respiratory (1 Subtype)" · slot "12 min" · `Date Completed` date · sub-type checkboxes (e.g. "asthama" ⚠ typo in data).

### Payroll tab (per staff; the Payroll module itself is "coming soon")
- **Payroll Documents** "(Supported formats: PDF, JPG, PNG, DOC, DOCX | Maximum file size: 10MB)". Table: Document Type · Uploaded Document · Date Added · Verified Date · Added By · Status · Action. Rows: **P45**, **HMRC Starter Checklist**, **Tax Code Update**, each "Pending Upload" with an **Upload** action.
- **Pension Enrolment** (radio-style options): No Pension · NHS Pension · GP Salaried Pension · NEST Pension.
- **Payroll Updates**: Deduction Amount\* (£) · Reason\* · End Date\* ("For how long these deductions should be made in future") · Additional Payment Amount\* (£) · Reason\* · End Date\*.

## Issues found
- **Invite submit button says "Sync with Clinical System"** instead of "Send Invite".
- The Email field in Send Invite has **no required marker**, yet an invite can't be sent without one.
- **Stat card labels are cut off** ("Active St…", "Pending I…").
- **Underlined status chips** look like links (likely resend), with no tooltip to say so.
- **Age group ranges overlap** (13-16, Above 16, 16-45).
- **Practice IDs differ** between calls: the staff list uses `c5832a86…` (organisation ID) while bulk import uses `583f435c…` (practice ID) for the same practice.
- Active tab colour is dark teal here; most other practice-level tabs use cyan.
- Archived Users loads `status=INACTIVE`, so "archived" and "inactive" appear to be the same state.
- Test data in dev ("claude-debug-invite-…", "Qa Fullsuccess").

## Not opened (change data or need your OK)
Archive / Lock user · clicking a resend chip · Save Changes on any tab · Upload actions · Download Template · actually sending an invite or importing.
