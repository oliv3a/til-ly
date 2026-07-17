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

## Pricing Plan (future)
- **Free tier**: GPT-4o-mini, ~20 messages/session, remembers last ~10 messages
- **Paid tier** (TBD): better model (GPT-4o+), unlimited/higher messages, full conversation memory, priority speed

## Future Ideas
- [ ] **Every mistake you've made** — log and categorize coding mistakes (bug type, language, root cause) so you can review patterns and avoid repeating them
- [ ] **Your coding style** — AI analyses your logs and code snippets to identify your coding style (e.g. functional vs OOP, naming conventions, preferred patterns)
- [ ] **Your strengths and weaknesses** — from your study history and mistakes, AI generates a strengths/weaknesses profile to guide what to focus on next
- [ ] **Upgrade code review model** — swap GPT-4o-mini for GPT-4o or a specialized code model once the app gains traction

## Post-MVP
See POSTMVP.md
