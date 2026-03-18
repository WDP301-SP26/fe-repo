# Context Window Handoff

## Date

2026-03-18

## Current Branch

- Branch: feat/new-flow-comingup
- Remote tracking: origin/feat/new-flow-comingup
- Recent commits:
  - 85a6d91 fix: searh params
  - 4ac34b1 fix: url query sync
  - 6df9d4d refactor code structure
  - 218eca8 fix: harden role redirects and legacy auth routes

## What Was Done Recently

1. Added URL query sync on groups list pages:
   - Student groups: q, status, size, page
   - Lecturer groups: q, classId, integration, size, page
2. Added Suspense boundary around pages using useSearchParams to satisfy Next.js build requirement.
3. Verified focused test passes:
   - pnpm nx test web --runInBand --testPathPatterns=src/lib/routes.spec.ts
4. Verified pre-push dry-run passes after Suspense fix.

## Important Files

- apps/web/src/app/student/groups/page.tsx
- apps/web/src/app/lecturer/groups/page.tsx
- apps/web/src/lib/routes.spec.ts
- docs/codex/codex-task-changelog.md
- docs/PROJECT_FLOWS_ONBOARDING.md

## Known Issue / Note

- Husky prints deprecation warning for legacy lines in .husky/pre-push, but push check currently passes.
- next build run manually from wrong folder can fail with "No package.json". Use repo root fe-repo.

## Next Priority Tasks

1. Implement server-side pagination contract (Task T-006):
   - FE switch from fetch-all to data + meta responses
   - BE provide pagination/filter endpoints and metadata
2. Keep URL query as source of truth while moving data fetching to backend pagination.
3. Add contract tests for pagination metadata.

## Rehydrate Prompt For New Context

Use this prompt at the start of a new context window:

"Continue from CONTEXT_HANDOFF.md and docs/codex/codex-task-changelog.md. We are on branch feat/new-flow-comingup. Current focus is Task T-006 (server-side pagination contract FE+BE). First validate current build and push checks, then implement BE contract and migrate FE groups pages from fetch-all to paginated API with metadata. Keep URL query sync behavior unchanged."
