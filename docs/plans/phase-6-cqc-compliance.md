# Phase 6 plan: CQC Compliance (inspection readiness)

**Status: approved 2026-11-04, with every recommended default.** Built from the BA's workbook "CQC Predicted Rating" (not a capture of the live app). The old staff-document screen that used to be called CQC Compliance is now **Compliance Dashboard** (`/compliance-dashboard`, docs/super-admin/08-cqc-compliance.md).

## What it is
A readiness tracker that produces a **predicted rating**: a management warning system, not a CQC scoring engine. One tracker per practice. 342 checks in 7 areas, 18 National GP Patient Survey measures, a CAS alert register and one action plan. Requirement text is verbatim from the workbook (`src/mocks/fixtures/cqc.ts`).

## Routes (`/verticals/public/cqc-compliance/…`)
`/` Overview · `/inspection-checklist` · `/estates-statutory` · `/clinical-searches` · `/cas-alerts` · `/surgery-audits` · `/risk-assessments` · `/policies` · `/national-patient-survey` · `/action-plan`. The module layout holds the practice picker (first practice by default) and the left area nav (`SettingsShell`).

## Rules taken from the workbook
- **Status:** Not checked, Gap, In progress, Complete, Outstanding evidence, Not applicable - justified. **Risk:** Immediate, High, Medium, Low, None.
- **Readiness** = (Complete + Outstanding evidence + Not applicable - justified) ÷ total checks. Gaps = Gap + In progress.
- **Area rating:** any unresolved High/Immediate → Inadequate risk; readiness < 50% → Inadequate readiness; any gap or < 85% → Requires improvement; ≥ 95% with no gaps and Outstanding evidence on at least 10% of the area's checks → Outstanding-ready; otherwise Good-ready.
- **Overall rating:** the same ladder over all checks; Outstanding-ready also needs at least **4 areas** that are Outstanding-ready. This settles the question of the guidance tab (four domains) against the dashboard formula (evidence per area): both apply.
- **Survey:** difference to national (sign flipped for "lower is better") scores 4 at +5pp or more, 3 within -3pp, 2 from -3 to -10pp, 1 below -10pp. The rating comes from the average score (< 1.5 Inadequate, < 2.5 Requires improvement, < 3.5 Good-ready, else Outstanding-ready). It is an internal comparison, not an official rating.
- **Action plan:** every Gap / In progress check links to exactly one action (`ACT-nnn`, created when the check is saved). An action closes only with completion evidence **and** an effectiveness check. A check can't be Complete, Outstanding or Not applicable while its action is open.
- All thresholds live in `src/features/cqc/rating.ts`.

## Deliberate differences from the workbook
- "Unresolved High/Immediate" counts any check that is not Complete, Outstanding or Not applicable. The workbook formula counts any status except Complete, so an Outstanding check with a High risk would still count.
- Survey measures count as "complete" once they have a result (as the dashboard formula does), so entering a poor result raises readiness. Flagged for the BA.
- The survey's lowest rating is shown as "Inadequate readiness" (the workbook says "Inadequate") so every area uses the same six labels.

## Components
Reused: `HubManagementLayout`, `ModulePageHeader`, `SettingsShell`, `StatsStrip` (cards), `DataTable`, `FilterBar`, `PracticeFilterSelect`, `StatusChip`, `FormDrawer`, `FormSectionCard`, `LabelValueList`, `DateField`.
Extensions: `SettingsShell navLabel`; `StatusChip` tones for check status, risk, rating, action and alert status (no new tokens, all existing tones).
New, feature-scoped (`src/features/cqc/`): `CqcShell`, `CqcOverview`, `CqcAreaPage`, `CqcSurveyPage`, `CqcActionPlanPage`, and in `components/`: `CheckDrawer`, `SurveyMeasureDrawer`, `AlertDrawer`, `CasAlertRegister`, `ActionDrawer`. Planned `AreaNav` became `SettingsShell`, so there is one new component fewer than proposed.

## States
Loading (spinner, in tables too), empty ("No checks found. Try another search."), data error (toast "Failed to load CQC compliance" and an inline line), validation ("{Field} is required" and the rules above, drawer Save stays disabled until valid), success toasts ("Check updated", "Action updated", "Measure updated", "Alert added"). Practice users get "You don't have access to this page" from `HubFrame`.

## API (all inferred; mocked with MSW, see docs/api-shapes.md)
Under `public/v1/sub-apps/{subAppId}/practices/{practiceId}/cqc/`. The mock tracker per practice is seeded the first time it is read (about one practice in five is tidy and Good-ready; the rest vary) and stored in `db.cqc`.

## Open questions for the BA
1. Should "Not applicable - justified" count towards readiness? (The dashboard formula says yes; kept.)
2. Should survey measures count as complete when merely entered? (Kept, as the formula does.)
3. Is the tracker per practice, or one per hub? (Per practice assumed; the practice-level sidebar item still says Coming soon.)
