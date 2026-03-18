# Context Window Handoff

## Date

2026-03-18

## Current Branch

- FE branch: feat/new-flow-comingup
- FE remote tracking: origin/feat/new-flow-comingup
- BE branch: main

## Current Status Summary

Completed in this window:

1. Landing page was redesigned from scratch (replacing old template structure).
2. Landing image prompts were prepared and image placement rules were documented.
3. AI Topic flow was implemented end-to-end (FE + BE), including:
   - AI generate/refine topic draft API
   - Save AI-generated topic API
   - Duplicate-topic protection
4. Student Topic Lab was separated into a dedicated page for leader workflow.
5. Admin navigation was implemented with real structure:
   - Sidebar
   - Layout
   - Breadcrumb header
   - Admin section routes (overview/users/classes/integrations)
6. Navigation QA/admin sync notes were updated in root documentation.

## Current FE Working Tree (Uncommitted)

- A LANDING_IMAGE_PROMPTS.md
- A apps/web/public/landing/README.md
- A apps/web/public/landing/capability-collage.png
- A apps/web/public/landing/hero-visual.png
- A apps/web/public/landing/problem-scene.png
- A apps/web/public/landing/workflow-diagram.png
- A apps/web/src/app/dashboard/admin/classes/page.tsx
- A apps/web/src/app/dashboard/admin/integrations/page.tsx
- M apps/web/src/app/dashboard/admin/page.tsx
- A apps/web/src/app/dashboard/admin/users/page.tsx
- M apps/web/src/app/dashboard/layout.tsx
- M apps/web/src/app/page.tsx
- M apps/web/src/app/student/groups/[id]/page.tsx
- A apps/web/src/app/student/groups/[id]/topic-lab/page.tsx
- A apps/web/src/components/admin-sidebar.tsx
- M apps/web/src/components/portal-header.tsx
- M apps/web/src/lib/api.ts
- M apps/web/src/lib/navigation.ts

## Current BE Working Tree

- No unstaged/staged changes detected at latest check.

## Important Files (Latest)

- apps/web/src/app/page.tsx
- LANDING_IMAGE_PROMPTS.md
- apps/web/public/landing/README.md
- apps/web/src/app/student/groups/[id]/topic-lab/page.tsx
- apps/web/src/app/student/groups/[id]/page.tsx
- apps/web/src/lib/api.ts
- apps/web/src/lib/navigation.ts
- apps/web/src/components/admin-sidebar.tsx
- apps/web/src/app/dashboard/layout.tsx
- apps/web/src/app/dashboard/admin/page.tsx
- apps/web/src/app/dashboard/admin/users/page.tsx
- apps/web/src/app/dashboard/admin/classes/page.tsx
- apps/web/src/app/dashboard/admin/integrations/page.tsx
- ../NAVIGATION_SCREEN_DIAGRAM.md

## Notes / Operational Caveats

1. Run FE commands from `fe-repo` root. Running from workspace root can cause missing package.json errors.
2. Nx/Next build output still shows baseline-browser-mapping staleness warning (non-blocking).
3. Landing images are now already present in `apps/web/public/landing/`.

## Next Priority Tasks

1. Commit and push current FE changes in logical commits (landing, admin nav, topic lab split).
2. Optional polish: wire actual landing `<img>` rendering to use files in `apps/web/public/landing/` (currently placeholders are still structural blocks).
3. Resume Task T-006 (server-side pagination contract FE + BE):
   - Keep URL query sync behavior unchanged
   - Move groups pages to backend paginated responses with metadata

## Rehydrate Prompt For New Context

Use this prompt at the start of a new context window:

"Continue from CONTEXT_HANDOFF.md in fe-repo. Current FE branch is feat/new-flow-comingup with uncommitted changes for landing redesign, admin navigation, and Topic Lab separation. First verify `pnpm nx build web`, then decide whether to commit current FE changes or continue with Task T-006 server-side pagination contract (FE + BE) while preserving URL query sync behavior."
