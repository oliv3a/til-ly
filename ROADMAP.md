# KeizoKode Roadmap

## Vision
Study-log platform where CS students upload daily progress, AI summarizes and extracts skills, and a portfolio wall displays their growth for both motivation and recruiter discovery.

## Tech Stack
- Next.js 16 (App Router, TypeScript)
- PostgreSQL + Prisma ORM
- NextAuth.js (credentials)
- OpenAI GPT-4
- Tailwind CSS v4 (Morning Sky theme)
- Uploadthing (file uploads)
- Vercel (deploy)

## Database (10 tables)
User, Account, Session, VerificationToken, Skill, UserSkill, StudyLog, StudyLogFile, StudyLogSkill, Goal, RoadmapItem, GoalStudyLog, DailyCheckin

## Pages
- `/` Landing
- `/auth/login`, `/auth/signup`
- `/dashboard` — welcome back, stats, goals, recommendations
- `/logs/new` — create study log with AI
- `/logs/[id]` — view/edit
- `/goals` — manage learning goals
- `/goals/[id]` — goal detail with roadmap
- `/portfolio/[userId]` — public wall (grid + timeline)
- `/profile` — settings
- `/recruit/students` — browse (recruiter)
- `/recruit/students/[userId]` — recruiter view

## Features
- Auth (email/password + JWT)
- Study log CRUD + file upload
- AI summarization + skill extraction
- Skill XP system (beginner/intermediate/expert)
- Goals with AI-generated roadmaps
- Streak tracking + daily check-in
- AI recommendations
- Portfolio wall (grid/timeline toggle)
- Recruiter search

## Post-MVP
See POSTMVP.md
