<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:session-summary -->
# Session Summary — til.ly (til-ly.vercel.app)

## Goal
Build til.ly, a study-log platform where CS students upload daily progress, AI summarizes and extracts resume-ready skills, and a portfolio wall displays growth for student motivation and recruiter discovery.

## Constraints & Preferences
- Tech stack: Next.js 16 (App Router, TypeScript), PostgreSQL via Prisma 7, NextAuth.js (credentials/JWT), OpenAI GPT-4o-mini, Tailwind CSS v4, Uploadthing, deploy on Vercel
- Auth: email/password + JWT, no email verification for MVP
- Prisma 7 requires driver adapter (@prisma/adapter-pg + pg), prisma.config.ts at root, datasource `url` removed from schema
- Next.js 16 uses proxy.ts instead of middleware.ts; route handler params must be awaited; Turbopack
- GitHub repo: `oliv3a/til-ly`

## Status (as of Jul 18, 2026 — evening)
- Core features complete: auth, study log CRUD, AI summarization, goals, portfolio, recruiter search, profile settings
- Phase 1 complete: error/loading pages, fake delays removed, confirm-password + auto-login
- Phase 2 complete: streak, AI error logging, portfolio API auth, goal progress recalculation
- **Dashboard redesign (Jul 7)** — 3-section narrative layout (Continue Learning → Activity → Progress), removed greeting/skills bar/panel-split, inline log expand, relative dates, compact stat row, `dash-card`/`dash-list-item`/`dash-section` CSS system, section dividers + numbered sections + left borders
- **Calendar streak widget (Jul 7)** — calendar moved beside Continue Learning as compact widget; `logsByDay` month query on server; soft-coral dots on logged days; streak trail (`streak-day` class, ~22% coral fill) highlighting consecutive days; today as full coral circle; streak count shown in calendar header
- **macOS menu bar app (Jul 7)** — SwiftPM executable in `macos/til.ly/`; NSStatusItem with Core Graphics mascot icon; NSPopover + WKWebView pointing to localhost:3000/menu-bar; right-click menu with Reload/Quit; activation policy `.accessory` (no dock icon); builds in ~3s, binary 81KB
- **Forgot/reset password (Jul 8)** — PasswordResetToken model, Resend email integration, forgot-password + reset-password pages, "Forgot password?" link on login
- **Menu-bar page (Jul 8)** — `/menu-bar` route with auth-aware client (logged out: greeting + login form; logged in: greeting + quick actions), macOS app URL updated to /menu-bar
- **Push notifications (Jul 10)** — web-push, VAPID keys, PushSubscription model, subscribe/test APIs, service worker, PushSetup component integrated in DashboardClient
- **Portfolio redesign — Option C (Jul 11)** — compact summary layout: 4-stat row (streak/skills/logs/projects), skill badges (no XP/pie chart/edit), goal progress bars, top 3 logs (title+date+tags), top 3 projects (title+status+progress), "View all" links (owner-only). `SkillsSection.tsx` deleted. `page.tsx` fetches only 3 logs/3 projects, computes goal progress from roadmap items.
- **Rebrand to til.ly (Jul 18)** — onigiri mascot replaced with Tilly (long-bodied dachshund-inspired dog, pastel teal/turquoise palette, dark charcoal outlines). All "KeizoKode" → "til.ly", "Keizo" → "Tilly", "keizokode" → "til-ly". Favicon updated. macOS app icon redrawn. New CSS animation names.
- **AI roadmap redesign (Jul 18)** — server-side `regenerateRoadmap()`, removed ChatGPT copy-paste workflow, two-mode UI (Manual Edit vs AI Edit) with custom AI instructions
- **Folder upload (Jul 18)** — shared `FileUpload.tsx` with `webkitdirectory` support, progress bar, batch uploads via single API request with parallel server processing
- **Project detail UX (Jul 18)** — checklist tools gated behind Edit mode (read-only by default), back link "← Building", removed `buildStepsPrompt()` ChatGPT copy/paste, AI-powered checklist extraction (`POST /steps/apply` with `extractChecklist()`)
- **Sidebar rename (Jul 18)** — "Goals" → "Learning", "Projects" → "Building" across NavBar, page titles, back links
- **Real World Connection (Jul 18)** — `realWorldConnection` field on StudyLog, Gen Z tone, shows how concepts apply to real apps, Edit/Generate support, server-side AI extraction
- **Image upload → AI reads handwriting (Jul 18)** — client-side compression (`compress-image.ts`, max 1024px JPEG 80%), server-side vision API extracts text from images, combined with `log.content` for summarization
- **Upload hint redesign (Jul 18)** — "📎 Upload anything" with bold icon row (`📸 notes · 📄 pdfs · 💻 code · 🖼️ screenshots → ✨ AI reads it all`)
- **Streak expansion (Jul 18)** — streak now triggers on 7 actions: create log, create project, toggle step complete, post project update, create goal, toggle roadmap item complete, submit code for review. All fire-and-forget, idempotent (one checkin per day max)

## Fixed Bugs
- **DELETE 500 error** — root cause: dev server ran stale Prisma client from before `xp` field was added to schema. `tag.xp` was `undefined`, causing `NaN` in XP calculation → Prisma rejected `NaN` as Int. Fix: restarted dev server + regenerated Prisma client + added `typeof tag.xp === "number" ? tag.xp : 0` guard.
- **Goal progress not updating** — link-goal route now recalculates `progressPct` on both POST and DELETE via `recalculateGoalProgress()` helper

## Running Commands
- Dev server: `npm run dev` (Next.js 16 + Turbopack, port 3000)
- Prisma Studio: `npx prisma studio` (port 5555)
- Prisma generate: `npx prisma generate` (must run after schema changes; dev server restart needed to pick up)
- Lint: `npm run lint`
- macOS menu bar app: `cd macos/til.ly && swift build -c release && open .build/release/tilly`

## Critical Gotchas
- After **any schema change**: run `npx prisma generate` AND restart dev server (Turbopack does NOT hot-reload Prisma client)
- .env contains live secrets — rotate before sharing
- When debugging Prisma queries, use `npx tsx --require dotenv/config` to load .env from project root
- StudyLogSkill FK is `studyLogId` (not `logId`), relation include name is `studyLog` (not `log`)

## Key Files
- `src/lib/checkin.ts` — streak logic (`processCheckin`), reusable across all triggers
- `src/lib/compress-image.ts` — client-side image compression
- `src/lib/ai.ts` — `summarizeStudyLog()` with `realWorldConnection`, `extractChecklist()`
- `src/app/api/logs/[id]/link-goal/route.ts` — goal link/unlink with progress recalc
- `src/app/api/projects/[id]/steps/apply/route.ts` — AI extraction of checklist steps
- `src/app/api/projects/[id]/steps/[stepId]/route.ts` — step toggle with streak trigger
- `src/app/api/projects/[id]/updates/route.ts` — project update with streak trigger
- `src/app/api/goals/[id]/roadmap-items/[rid]/route.ts` — roadmap item toggle with streak trigger
- `src/app/api/code-review/route.ts` — code review with streak trigger
- `src/app/logs/[id]/RealWorldConnection.tsx` — Gen Z real world connection card
- `src/components/FileUpload.tsx` — shared drag-and-drop + folder upload component
- `src/app/portfolio/[userId]/PortfolioClient.tsx` — client state with skills+goals from DELETE response
- `src/app/dashboard/DashboardClient.tsx` — 3-section narrative layout with inline expand, calendar streak widget
- `macos/til.ly/Sources/StatusBarController.swift` — menu bar popover with WKWebView + mascot icon
<!-- END:session-summary -->
