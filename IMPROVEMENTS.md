# til.ly Improvement Plan

## Phase 1: Quick Wins (~30 min)

### 1.1 Add error.tsx + loading.tsx files
- **Files to create:**
  - `src/app/error.tsx` — root error boundary
  - `src/app/loading.tsx` — root loading skeleton
  - `src/app/dashboard/loading.tsx`
  - `src/app/goals/loading.tsx`
  - `src/app/logs/new/loading.tsx`
  - `src/app/portfolio/[userId]/loading.tsx`
  - `src/app/profile/loading.tsx`

### 1.2 Remove fake delays from log submission
- **File:** `src/app/logs/new/page.tsx`
- Remove `await new Promise(r => setTimeout(r, 600))` (uploading phase)
- Remove `await new Promise(r => setTimeout(r, 1200))` (done phase)
- Phases trigger on real upload and AI analysis instead

### 1.3 Fix profile form pre-fill + save
- **File:** `src/app/profile/ProfileClient.tsx`
  - Fetch profile data from `GET /api/profile` on mount to pre-fill bio/school/year
  - Currently only `name` is filled from session
- **File:** `src/app/api/profile/route.ts`
  - Strip empty strings: if field is `""`, set to `undefined` so DB keeps existing value

### 1.4 Add confirm password, auto-login, server-side validation
- **File:** `src/app/auth/signup/page.tsx`
  - Add confirm password field
  - Client-side check passwords match
  - Auto-login after successful registration via `signIn("credentials", ...)`
- **File:** `src/app/api/auth/register/route.ts`
  - Server-side password length check (`>= 6`)
  - Server-side complexity check (uppercase, number)

### 1.5 Fix goals dropdown going stale on portfolio
- **File:** `src/app/portfolio/[userId]/PortfolioClient.tsx`
  - Add `useEffect` to refetch goals on mount so deleted goals don't persist in dropdown

### 1.6 Fix custom signout — delete session from DB
- **File:** `src/app/api/auth/signout/route.ts`
  - Import `auth` + `prisma`
  - Find and delete session record from database on signout
  - Keep cookie clearing

---

## Phase 2: Core Bug Fixes (~25 min) ✅

### 2.1 Fix streak calculation
- **File:** `src/app/api/checkin/route.ts`
  - Rewrote streak logic: uses `findFirst { date: { lt: todayUTC } }` instead of fragile `skip: 1`
  - Accepts optional `timezoneOffset` from client for timezone-aware midnight
  - Resets streak to 1 if gap >1 day, increments if gap === 1 day
  - Encased in try/catch with 500 response

### 2.2 Add XP rollback on log delete
- **File:** `src/app/api/logs/[id]/route.ts`
  - Added `xp Int @default(0)` field to `StudyLogSkill` schema + `db push`
  - POST route now stores `xp` on join table during log creation
  - DELETE route reads `xp` from join table, subtracts from `UserSkill`, recalculates level
  - Recalculates linked goals' `progressPct` using formula: `min(round((count-1) / (items*2) * 100), 100)`

### 2.3 Add error logging to silent AI catches
- **File:** `src/lib/ai.ts`
  - All 3 catch blocks (`summarizeStudyLog`, `generateRoadmap`, `getRecommendation`) now log: `console.error("name failed:", err)`

### 2.4 Fix portfolio API — add auth + strip email
- **File:** `src/app/api/portfolio/[userId]/route.ts`
  - Added `auth()` call, `isOwner` check comparing session user id vs requested userId
  - Uses conditional `select: { email: isOwner }` so email is excluded for public viewers

---

## Phase 3: Error Handling & Resilience (~25 min)

### 3.1 Add try/catch + error UI to client fetch calls
- **Files:** DashboardClient, GoalsClient, ProfileClient, StudentsClient
- Wrap all fetches in try/catch
- Display inline error messages

### 3.2 Add try/catch to unprotected API routes
- **Files:** `api/profile/route.ts`, `api/skills/route.ts`, `api/recommendations/route.ts`, `api/checkin/route.ts`
- Wrap handlers in try/catch returning structured 500 errors

### 3.3 Add server-side password strength validation
- **File:** `src/app/api/auth/register/route.ts`
- Minimum 6 chars, uppercase letter, number

---

## Phase 4: UX Polish (~25 min)

### 4.1 Build Toast component
- **Create:** `src/components/Toast.tsx`
- Simple fixed bottom-right toast, auto-dismiss 3s
- Types: success, error, info
- Wire into: log submitted, goal created/deleted, profile saved, checkin, link assignment, log delete

### 4.2 Replace confirm() dialogs with inline UI
- **Files:** GoalsClient, PortfolioClient
- Track `confirmDeleteId` state
- Show inline Yes/No confirmation instead of browser `confirm()`

### 4.3 Add "New Log" button on portfolio for owner
- **File:** PortfolioClient
- Button next to "Study Logs" heading when `isOwner` is true

### 4.4 Fix recruit API — remove email from public response
- **File:** `src/app/api/recruit/students/route.ts`
- Remove `email: true` from select

---

## Phase 5: Security (you handle)

### 5.1 Rotate secrets
- Rotate OpenAI API key
- Rotate AUTH_SECRET
- Regenerate Neon database password
