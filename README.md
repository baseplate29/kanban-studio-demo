# Kanban Studio

Shared Kanban board with signup/login and an AI chat sidebar that can create, edit, and move cards. Next.js (App Router) + Postgres (Drizzle ORM) + OpenRouter.

## Development

Requirements: Node 20+, Docker. Put `OPENROUTER_API_KEY`, `DATABASE_URL`, and `SESSION_SECRET` in `.env` (see docs/DATABASE.md for the local `DATABASE_URL`).

```
docker compose up -d      # local Postgres
npm install
npm run db:migrate        # apply migrations
npm run db:seed           # create the shared board
npm run dev               # http://localhost:3000
```

## Testing

```
npm test                  # unit + integration (needs the database running)
npm run test:e2e          # Playwright end-to-end tests
npm run ai:check          # AI connectivity check
```

## Docs

Plan and schema documentation live in `docs/`.
