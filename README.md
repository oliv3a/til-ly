# til.ly

A daily study-log platform for CS students. In tech you have to consistently learn, stay up to date, and be adaptable. til.ly helps you build that habit — log what you study each day, AI summarizes your work, tracks skills and streaks, and generates a resume from your actual learning journey.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL + Prisma 7
- **Auth:** NextAuth.js (email/password + JWT)
- **AI:** OpenAI GPT-4o-mini
- **Email:** Resend
- **Styling:** Tailwind CSS v4
- **Deploy:** Vercel

## Features

- Study log CRUD with AI analysis — summaries, skill extraction, next-topic recommendations
- Goals with AI-generated roadmaps
- Streak tracking + daily check-in
- AI-generated resume from study logs and projects (editable, PDF export)
- Portfolio page showing skills, goals, and progress
- Push notifications (daily reminders)
- macOS menu bar app (quick status glance)
- Forgot/reset password

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
