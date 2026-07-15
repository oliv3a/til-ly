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
- Prisma 7 requires driver adapter (@prisma/adapter-pg + pg), prisma.config.ts at root, datasource `url` removed from schema
- Next.js 16 uses proxy.ts instead of middleware.ts; route handler params must be awaited; Turbopack

## Status (as of Jul 11, 2026)
- Core features complete: auth, study log CRUD, AI summarization, goals, portfolio, recruiter search, profile settings
- Phase 1 complete: error/loading pages, fake delays removed, confirm-password + auto-login
- Phase 2 complete: streak, AI error logging, portfolio API auth, goal progress recalculation
- **Dashboard redesign (Jul 7)** — 3-section narrative layout (Continue Learning → Activity → Progress), removed greeting/skills bar/panel-split, inline log expand, relative dates, compact stat row, `dash-card`/`dash-list-item`/`dash-section` CSS system, section dividers + numbered sections + left borders
- **Calendar streak widget (Jul 7)** — calendar moved beside Continue Learning as compact widget; `logsByDay` month query on server; soft-coral dots on logged days; streak trail (`streak-day` class, ~22% coral fill) highlighting consecutive days; today as full coral circle; streak count shown in calendar header
- **macOS menu bar app (Jul 7)** — SwiftPM executable in `macos/KeizoKode/`; NSStatusItem with Core Graphics Onigiri icon; NSPopover + WKWebView pointing to localhost:3000/menu-bar; right-click menu with Reload/Quit; activation policy `.accessory` (no dock icon); builds in ~3s, binary 81KB
- **Forgot/reset password (Jul 8)** — PasswordResetToken model, Resend email integration, forgot-password + reset-password pages, "Forgot password?" link on login
- **Menu-bar page (Jul 8)** — `/menu-bar` route with auth-aware client (logged out: greeting + login form; logged in: greeting + quick actions), macOS app URL updated to /menu-bar
- **Push notifications (Jul 10)** — web-push, VAPID keys, PushSubscription model, subscribe/test APIs, service worker, PushSetup component integrated in DashboardClient
- **Portfolio redesign — Option C (Jul 11)** — compact summary layout: 4-stat row (streak/skills/logs/projects), skill badges (no XP/pie chart/edit), goal progress bars, top 3 logs (title+date+tags), top 3 projects (title+status+progress), "View all" links (owner-only). `SkillsSection.tsx` deleted. `page.tsx` fetches only 3 logs/3 projects, computes goal progress from roadmap items.

## Fixed Bugs
- **DELETE 500 error** — root cause: dev server ran stale Prisma client from before `xp` field was added to schema. `tag.xp` was `undefined`, causing `NaN` in XP calculation → Prisma rejected `NaN` as Int. Fix: restarted dev server + regenerated Prisma client + added `typeof tag.xp === "number" ? tag.xp : 0` guard.
- **Goal progress not updating** — link-goal route now recalculates `progressPct` on both POST and DELETE via `recalculateGoalProgress()` helper

## Running Commands
- Dev server: `npm run dev` (Next.js 16 + Turbopack, port 3000)
- Prisma Studio: `npx prisma studio` (port 5555)
- Prisma generate: `npx prisma generate` (must run after schema changes; dev server restart needed to pick up)
- Lint: `npm run lint`
- macOS menu bar app: `cd macos/KeizoKode && swift build -c release && open .build/release/KeizoKode`

## Critical Gotchas
- After **any schema change**: run `npx prisma generate` AND restart dev server (Turbopack does NOT hot-reload Prisma client)
- .env contains live secrets — rotate before sharing
- When debugging Prisma queries, use `npx tsx --require dotenv/config` to load .env from project root
- StudyLogSkill FK is `studyLogId` (not `logId`), relation include name is `studyLog` (not `log`)

## Key Files
- `src/app/api/logs/[id]/link-goal/route.ts` — goal link/unlink with progress recalc
- `src/app/portfolio/[userId]/PortfolioClient.tsx` — client state with skills+goals from DELETE response
- `src/app/dashboard/DashboardClient.tsx` — 3-section narrative layout with inline expand, calendar streak widget
- `macos/KeizoKode/Sources/StatusBarController.swift` — menu bar popover with WKWebView + Onigiri icon
<!-- END:session-summary -->
