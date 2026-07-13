<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:session-summary -->
# Session Summary — KeizoKode (keizokode.vercel.app)

## Goal
Build KeizoKode, a study-log platform where CS students upload daily progress, AI summarizes and extracts resume-ready skills, and a portfolio wall displays growth for student motivation and recruiter discovery.

## Constraints & Preferences
- Tech stack: Next.js 16 (App Router, TypeScript), PostgreSQL via Prisma 7, NextAuth.js (credentials/JWT), OpenAI GPT-4o-mini, Tailwind CSS v4, Uploadthing, deploy on Vercel
- Auth: email/password + JWT, no email verification for MVP
- Skill levels: beginner (0 XP) → intermediate (100 XP) → expert (300 XP); XP by depth: surface=5, moderate=15, deep=30
- Prisma 7 requires driver adapter (@prisma/adapter-pg + pg), prisma.config.ts at root, datasource `url` removed from schema
- Next.js 16 uses proxy.ts instead of middleware.ts; route handler params must be awaited; Turbopack

## Status (as of Jul 7, 2026)
- Core features complete: auth, study log CRUD, AI summarization, skills engine, goals, portfolio, recruiter search, profile settings
- Phase 1 complete: error/loading pages, fake delays removed, confirm-password + auto-login
- Phase 2.1 (streak) — fixed with timezone offset from client
- Phase 2.2 (XP rollback) — done; StudyLogSkill has `xp Int @default(0)`, old records backfilled via `scripts/backfill-xp.ts`
- Phase 2.3 (AI error logging) — done; all 3 AI catch blocks log errors
- Phase 2.4 (portfolio API auth) — done; email hidden for non-owners
- Phase 2 extra: goal progress recalculates on link/unlink; DELETE returns fresh skills+goals
- **Dashboard redesign (Jul 7)** — 3-section narrative layout (Continue Learning → Activity → Progress), removed greeting/skills bar/panel-split, inline log expand, relative dates, compact stat row, `dash-card`/`dash-list-item`/`dash-section` CSS system, section dividers + numbered sections + left borders
- **Calendar streak widget (Jul 7)** — calendar moved beside Continue Learning as compact widget; `logsByDay` month query on server; soft-coral dots on logged days; streak trail (`streak-day` class, ~22% coral fill) highlighting consecutive days; today as full coral circle; streak count shown in calendar header
- **macOS menu bar app (Jul 7)** — SwiftPM executable in `macos/KeizoKode/`; NSStatusItem with Core Graphics Onigiri icon; NSPopover + WKWebView pointing to localhost:3000; right-click menu with Reload/Quit; activation policy `.accessory` (no dock icon); builds in ~3s, binary 81KB

## Fixed Bugs
- **DELETE 500 error** — root cause: dev server ran stale Prisma client from before `xp` field was added to schema. `tag.xp` was `undefined`, causing `NaN` in XP calculation → Prisma rejected `NaN` as Int. Fix: restarted dev server + regenerated Prisma client + added `typeof tag.xp === "number" ? tag.xp : 0` guard.
- **Skills XP not updating on portfolio after delete** — fixed by returning fresh `skills`+`goals` in DELETE response; PortfolioClient updates state from response data. **Further fix**: changed from subtract-based XP rollback to full recalculation — delete log first, then fetch ALL UserSkills + ALL remaining StudyLogSkill records, sum XP per skill, and set each UserSkill to that total. This handles orphaned XP (e.g., Python's 120 from data migration) by setting it to 0 when no StudyLogSkill records remain.
- **Goal progress not updating** — link-goal route now recalculates `progressPct` on both POST and DELETE via `recalculateGoalProgress()` helper

## Running Commands
- Dev server: `npm run dev` (Next.js 16 + Turbopack, port 3000)
- Prisma Studio: `npx prisma studio` (port 5555)
- Backfill: `npm run backfill-xp` (runs scripts/backfill-xp.ts via tsx)
- Prisma generate: `npx prisma generate` (must run after schema changes; dev server restart needed to pick up)
- Lint: `npm run lint`
- macOS menu bar app: `cd macos/KeizoKode && swift build -c release && open .build/release/KeizoKode`

## Critical Gotchas
- After **any schema change**: run `npx prisma generate` AND restart dev server (Turbopack does NOT hot-reload Prisma client)
- .env contains live secrets — rotate before sharing
- When debugging Prisma queries, use `npx tsx --require dotenv/config` to load .env from project root
- StudyLogSkill FK is `studyLogId` (not `logId`), relation include name is `studyLog` (not `log`)
- The DELETE handler subtracts `tag.xp` from UserSkill and recalculates goal progress

## Key Files
- `src/app/api/logs/[id]/route.ts` — DELETE with XP rollback + try/catch
- `src/app/api/logs/[id]/link-goal/route.ts` — goal link/unlink with progress recalc
- `src/app/portfolio/[userId]/PortfolioClient.tsx` — client state with skills+goals from DELETE response
- `scripts/backfill-xp.ts` — one-time backfill for old StudyLogSkill records
- `src/lib/skill-engine.ts` — `getLevelForXp()` exported
- `src/app/dashboard/DashboardClient.tsx` — 3-section narrative layout with inline expand, calendar streak widget
- `macos/KeizoKode/Sources/StatusBarController.swift` — menu bar popover with WKWebView + Onigiri icon
<!-- END:session-summary -->
