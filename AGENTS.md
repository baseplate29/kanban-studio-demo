# The Project Management MVP web app

## Business Requirements

This project is building a Project Management App. Key features:
- Users can sign up and sign in with a username and password
- All signed-in users share one Kanban board and edit it collaboratively
- The Kanban board has fixed columns that can be renamed
- The cards on the Kanban board can be moved with drag and drop, and edited
- Changes made by other users appear via polling refresh (every few seconds)
- There is an AI chat feature in a sidebar; the AI is able to create / edit / move one or more cards

## Limitations

For the MVP, there is one shared Kanban board for all users, but the schema should allow multiple boards in the future.

For the MVP, concurrent edits are last-write-wins; polling keeps everyone roughly in sync. No websockets/real-time.

## Technical Decisions

- Full-stack Next.js (App Router, TypeScript) at the repo root. No separate backend: API logic lives in Next.js Route Handlers / Server Actions
- Postgres as the database, accessed via the standard `pg` (node-postgres) driver with Drizzle ORM; the app always connects through `DATABASE_URL` in `.env`
- Local development: plain Postgres in Docker (official `postgres` image via docker-compose) on localhost:5432
- Production: deployed on Vercel, connected to Neon (same code and migrations, just a different `DATABASE_URL`)
- Auth built in-app: username/password signup and login, passwords hashed (bcrypt), session in a signed HTTP-only cookie
- Use OpenRouter for the AI calls. An OPENROUTER_API_KEY is in .env in the project root
- Use `openai/gpt-oss-120b` as the model
- Run locally with `npm run dev` plus `docker compose up` for the database

## Color Scheme

- Accent Yellow: `#ecad0a` - accent lines, highlights
- Blue Primary: `#209dd7` - links, key sections
- Purple Secondary: `#753991` - submit buttons, important actions
- Dark Navy: `#032147` - main headings
- Gray Text: `#888888` - supporting text, labels

## Coding standards

1. Use latest versions of libraries and idiomatic approaches as of today
2. Keep it simple - NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features - focus on simplicity.
3. Be concise. Keep README minimal. IMPORTANT: no emojis ever
4. When hitting issues, always identify root cause before trying a fix. Do not guess. Prove with evidence, then fix the root cause.

## Working documentation

All documents for planning and executing this project will be in the docs/ directory.
Please review the docs/PLAN.md document before proceeding.
