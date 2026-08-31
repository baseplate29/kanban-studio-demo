# Live Demo Plan

A ~30 minute live vibe-coding session: start from the prebuilt frontend on the `demo-start` branch and build the backend and the AI assistant live with Claude Code.

## Branches

- `main` — the finished reference app. Safety net: if a live step stalls, copy the corresponding file from here (`git show main:lib/ai.ts`, etc.) or diff against it.
- `demo-start` — the session's starting point. Full styled frontend (board with drag and drop, optimistic updates, polling, auth screen, app shell, dark mode) but no database, no auth logic, no AI. The board works with in-memory state; changes vanish on reload — that is the opening narrative.

## Before the session (do not skip)

1. `git checkout demo-start` and `npm install`.
2. Docker running; `docker pull postgres:18` in advance (pulling live wastes minutes).
3. `.env` in the repo root with `OPENROUTER_API_KEY`, `DATABASE_URL=postgres://postgres:postgres@localhost:5432/kanban`, and a `SESSION_SECRET` (openssl rand -hex 32). Note: end the file with a newline.
4. `npm run dev` serves the board at localhost:3000 in guest mode.
5. Do one full practice run.

## Live build plan (~30 min)

Times assume Claude Code does the writing; you narrate and verify.

1. **Intro (2 min).** Show the board working, reload the page, changes are gone. "Let's give it a real backend."
2. **Database + persistence (8 min).** Prompt Claude for: docker-compose with `postgres:18`, Drizzle schema (users, boards, columns, cards — schema below), migrate, seed the shared board, then route handlers matching the contract below. The frontend is already calling these endpoints — the moment they exist, reload and the board persists. That is the first payoff.
3. **Auth (6 min — CUT THIS IF BEHIND).** bcrypt password hashing, JWT session in an HTTP-only cookie, implement the stubbed server actions in `app/auth-actions.ts`, gate the page on a session. The login/signup UI already exists.
4. **AI assistant (12 min).** OpenRouter client with model `openai/gpt-oss-120b`; POST `/api/chat` that sends the board JSON plus conversation, gets Structured Outputs back (reply + card actions), validates and applies them; chat sidebar UI with a board refresh on apply. Finish by asking the AI to "add three cards for launch prep and move one to In Progress" — the wow moment.
5. **Buffer (2 min).**

## Contracts the frontend already expects

Board JSON (returned by GET /api/board):

```json
{ "columns": [ { "id": "uuid", "name": "To Do", "cards": [ { "id": "uuid", "title": "", "description": "" } ] } ] }
```

Endpoints called by `lib/board-api.ts` (all JSON, all require a session once auth exists):

- `GET /api/board` — full board
- `PATCH /api/columns/:id` — `{ name }`
- `POST /api/cards` — `{ id?, columnId, title, description? }` (client may supply the uuid)
- `PATCH /api/cards/:id` — `{ title?, description? }` to edit, or `{ toColumnId, toIndex }` to move
- `DELETE /api/cards/:id`

Schema: users (id uuid, username unique, password_hash, created_at), boards (id, name), columns (id, board_id FK, name, position int), cards (id, column_id FK, title, description default '', position int, created_at). One row in boards is "the" shared board. Ordering via integer position, moves renumber the target column. Concurrency is last-write-wins.

Auth stubs to implement live: `signup`, `login`, `logout` in `app/auth-actions.ts` (signatures already match the UI's `useActionState` usage — return an error string or null).

## Gotchas (each of these cost real time when this app was first built)

- **OpenRouter ignores `response_format` on some providers.** Send `provider: { require_parameters: true }` in the request body or the model returns free-form JSON and structured outputs silently fail. Also spell out the JSON shape in the system prompt as a fallback.
- **Server Actions through a Codespaces forwarded URL** fail with "Invalid Server Actions request" — `next.config.ts` needs `experimental.serverActions.allowedOrigins: ["localhost:3000", "*.app.github.dev"]` (already present on `demo-start`).
- **`.env` without a trailing newline**: appending `VAR=...` glues it onto the previous line. Always check.
- **shadcn (Base UI) `<Button>` defaults to `type="button"`** — a Button submitting a form needs an explicit `type="submit"` or the form silently does nothing.
- **tsx scripts**: no top-level await in this repo's module setup — wrap in `async function main()`.
- **Next 16 allows one dev server per project.** A second `next dev` refuses to start (the e2e setup on `main` works around it with a separate `NEXT_DIST_DIR`).
- **AI output is nondeterministic** — occasionally the model returns a junk reply. If the live AI call flubs, just send the message again; do not debug it on stage.

## Suggested live prompts

1. "Add Postgres persistence: docker-compose with postgres:18, a Drizzle schema for users/boards/columns/cards per docs/DEMO.md, migrations, a seed for the shared board with To Do / In Progress / Done, and route handlers matching the contract in docs/DEMO.md. The frontend fetch layer in lib/board-api.ts already calls those endpoints."
2. "Implement the auth stubs in app/auth-actions.ts: bcrypt-hashed signup/login against the users table, JWT session in an HTTP-only cookie, and gate the board behind login in app/page.tsx."
3. "Add an AI assistant: OpenRouter client (model openai/gpt-oss-120b, key in .env), a POST /api/chat route that sends the current board JSON with the conversation and uses Structured Outputs to return a reply plus card actions (create/update/move/delete), validates and applies them, and a chat sidebar next to the board that refreshes it when the AI makes changes. Mind the OpenRouter gotcha in docs/DEMO.md."
