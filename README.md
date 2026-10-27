# Aqlios CRM rebuild

A rebuild of the Aqlios Public Primary Care CRM from the live dev app. The specs are in `docs/`, the plan is in `REBUILD-PLAN.md`, and the project rules are in `CLAUDE.md`.

## Commands

```bash
npm install
npm run dev          # http://localhost:3000
npm run check        # typecheck + lint + prettier check
npm run build        # static export to out/ (what GitHub Pages serves)
npm run test:e2e     # Playwright against out/ (run build first)
```

## Deployment

`.github/workflows/deploy.yml` builds the static export on every push to `main` and publishes it to GitHub Pages. The base path is set from the repository name.

## Status

Phase 0 (setup) is done: Next.js 16 + TypeScript, MUI 9 themed from `src/theme/tokens.ts`, Poppins and Inter fonts, static export, and lint, typecheck and Playwright are set up. Phase 1 (mock API, mock auth, first deploy) is next.
