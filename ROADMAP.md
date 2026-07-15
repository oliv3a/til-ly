# KeizoKode Roadmap

## Vision
Build the daily-learning habit. Log progress, get AI summaries, track skills and streaks, and generate a resume from your real work.

## Tech Stack
- Next.js 16 (App Router, TypeScript)
- PostgreSQL + Prisma 7
- NextAuth.js (credentials/JWT)
- OpenAI GPT-4o-mini
- Resend (email)
- Tailwind CSS v4
- Vercel (deploy)

## Database (21 models)
User, Account, Session, VerificationToken, Skill, UserSkill, StudyLog, StudyLogFile, StudyLogSkill, Goal, RoadmapItem, StudyLogRoadmapItem, GoalStudyLog, Project, ProjectFile, ProjectStep, ProjectUpdate, PushSubscription, PasswordResetToken, Resume, DailyCheckin

## Pages
- `/` Landing
- `/auth/login`, `/auth/signup`
- `/forgot-password`, `/reset-password`
- `/dashboard` — logs, streak, goals, progress
- `/logs` — browse logs
- `/logs/new` — create log with AI analysis
- `/logs/[id]` — view/edit
- `/goals` — manage learning goals
- `/goals/[id]` — goal detail with roadmap
- `/projects` — project management
- `/resume` — AI resume generator
- `/portfolio/[userId]` — public view of skills, goals, progress
- `/profile` — settings (manage skills)
- `/menu-bar` — compact macOS menu bar page
- `/privacy` — privacy policy

## Current Features
- Auth (email/password + JWT, forgot/reset password)
- Study log CRUD with AI analysis (summary, skill extraction, recommendations)
- Goals with AI-generated roadmaps
- Streak tracking + daily check-in
- AI-generated resume from logs + projects (editable, PDF export)
- Portfolio page (compact summary: stats, skill badges, goals, recent logs/projects)
- Push notifications (daily reminders)
- macOS menu bar app

## Post-MVP
See POSTMVP.md
