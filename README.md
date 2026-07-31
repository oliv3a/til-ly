# til.ly

A daily study-log platform for CS students. In tech you have to consistently learn, stay up to date, and be adaptable. til.ly helps you build that habit — log what you study each day, AI summarizes your work, tracks skills and streaks, and keeps your resume ready to go as you learn.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL + Prisma 7
- **Auth:** NextAuth.js (email/password + JWT)
- **AI:** OpenAI GPT-4o-mini
- **Email:** Resend
- **Styling:** Tailwind CSS v4
- **Deploy:** Vercel

## Features
- Resume that keeps up with you : auto-built from your study logs and skills, editable, PDF export, ATS-checked
- Study log CRUD with AI analysis : summaries, skill extraction, next-topic recommendations
- Learning goals : set a goal and get a step-by-step roadmap with estimated study time per step; check steps off as you study, link logs to show real progress, and graduate with a celebration when you finish
- Project Building : turn ideas into shipped projects with step-by-step checklists (beginner→advanced), progress tracking, folder/code uploads, and honest, encouraging feedback on every update
- Mentor chat : a context-aware study mentor with a real personality; warm, senior-CS-student vibes, short and human-feeling replies that reference your actual logs, goals, and skills; remembers conversations; customizable name
- Streak tracking + daily check-in
- Portfolio page showing skills, goals, and progress
- macOS menu bar app (quick status glance)


## Live App

Visit [til-ly.vercel.app](https://til-ly.vercel.app) — just sign up.

## Running Locally

Only needed if you want to modify the code. Otherwise use the live app above.

1. Ensure PostgreSQL is running
2. Copy `.env.example` to `.env` and fill in the values
3. Install dependencies and generate the Prisma client:

```bash
npm install
npx prisma generate
npx prisma db push
```

4. Start the dev server:

```bash
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open database browser |
| `npx prisma generate` | Regenerate Prisma client (after schema changes) |

## macOS Menu Bar App

```
cd macos/til.ly && swift build -c release && open .build/release/tilly
```
