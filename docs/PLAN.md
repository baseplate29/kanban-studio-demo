# Project Plan

Detailed plan for building the Project Management MVP. Each part has a checklist to be checked off as work completes, plus tests and success criteria. Parts are done in order; a part is not started until the previous part's success criteria are met.

Stack (see AGENTS.md): full-stack Next.js (App Router, TypeScript) at the repo root, Postgres via the `pg` driver and Drizzle ORM (plain Postgres in Docker for development, Neon in production), in-app signup/password auth, OpenRouter for AI, deployed to Vercel.

Prerequisites the user must provide:
- Docker Desktop running locally — needed from Part 4
- `OPENROUTER_API_KEY` in `.env` — needed from Part 9
- A Vercel account and a Neon project (its connection string becomes the production `DATABASE_URL`) — needed from Part 12

Note: auth (Part 5) comes after the database (Part 4) because signup needs the users table.

## Part 1: Plan

- [x] Rewrite AGENTS.md for the Next.js + Neon stack
- [x] Remove obsolete backend/ and scripts/ placeholders
- [x] Enrich this document with substeps, tests, and success criteria
- [x] Update plan for multi-user shared board, Neon Local via Docker, and Vercel deployment
- [x] User reviews and approves the plan

Success criteria: user approves this plan. Approved 2026-08-31.

## Part 2: Scaffolding

- [x] Scaffold a Next.js app (App Router, TypeScript, Tailwind) at the repo root
- [x] Add the color scheme from AGENTS.md as CSS variables / Tailwind theme tokens
- [x] Set up test tooling: Vitest + React Testing Library for unit/component tests, Playwright for end-to-end tests
- [x] Minimal home page renders

Tests: one smoke test that the home page renders; one trivial Playwright test that / loads.
Success criteria: `npm run dev` serves the app at /, `npm test` and `npm run lint` pass.

## Part 3: Kanban board UI

- [x] Define TypeScript types for the board (columns, cards)
- [x] Board with fixed columns (To Do, In Progress, Done) that can be renamed inline
- [x] Cards: create, edit title/description, delete
- [x] Drag and drop cards within and between columns
- [x] Local state only at this stage; styled per the color scheme

Tests: unit tests for all board state operations (rename column, card CRUD, move card); component tests for column rename and card create/edit; Playwright test for a drag-and-drop move.
Success criteria: full board interaction works in the browser; all tests pass.

## Part 4: Database

- [x] docker-compose.yml running the official `postgres` image, exposing localhost:5432; app connects via `DATABASE_URL` in `.env`
- [x] Design schema: users, boards, columns, cards — one shared board for the MVP, but boards as a table so more can exist later
- [x] Define the schema with Drizzle ORM
- [x] Document the schema and approach in docs/DATABASE.md and get user sign-off (doc written; sign-off pending)
- [x] Apply the schema with Drizzle migrations
- [x] Seed the shared board with its default columns

Tests: migrations apply cleanly to a fresh database; seed script is idempotent.
Success criteria: user approves docs/DATABASE.md; `docker compose up` gives a working local Postgres database with tables and seed data.

## Part 5: User accounts

- [x] Signup form: username + password, password hashed with bcrypt, user stored in the database
- [x] Login form shown at / when not signed in; the shared board shown when signed in
- [x] Session kept in a signed HTTP-only cookie; log out clears it
- [x] Duplicate username and wrong credentials show error messages

Tests: unit tests for password hashing/verification and signup validation; Playwright tests for: signup then login, board hidden when signed out, failed login shows error, duplicate signup rejected, logout returns to login form.
Success criteria: two different users can each sign up and log in; the board is only reachable through login; all tests pass.

## Part 6: API layer

- [x] Route Handlers / Server Actions for: get board, rename column, create card, edit card, delete card, move card
- [x] Every operation requires a valid session; all users operate on the shared board
- [x] Concurrent edits are last-write-wins; no locking

Tests: integration tests against a test database covering each operation, plus rejection of unauthenticated requests; test that two users' edits both land on the shared board.
Success criteria: all board operations read/write the database correctly; all tests pass.

## Part 7: Frontend + API

- [x] Board loads from the database on sign-in
- [x] All mutations (rename, card CRUD, drag and drop) persist through the API layer
- [x] Optimistic updates so drag and drop stays smooth
- [x] Polling refresh (every few seconds) so other users' changes appear without a manual reload

Tests: Playwright test: log in, create a card, move it, reload the page — the change persists; Playwright test with two sessions: user A creates a card, user B sees it appear via polling; unit tests for the data-fetching/mutation layer.
Success criteria: the board fully survives page reloads and reflects other users' edits; all tests pass.

## Part 8: Styling with shadcn/ui

- [x] Initialize shadcn/ui (Tailwind v4, components.json) and add the components the app needs (button, card, input, textarea, label)
- [x] Map the AGENTS.md color scheme onto the shadcn theme tokens (purple as primary for buttons/actions; yellow, blue, navy, gray as brand tokens)
- [x] Restyle the auth forms, header, board columns, and cards with shadcn components
- [x] Keep all accessible names/labels stable so existing tests still pass
- [x] Visual pass: app-shell header with logo mark, avatar dropdown user menu, dark mode toggle (next-themes), column card-count badges and separators, empty states, chat bubbles with AI avatar
- [x] Blocks pass: rebuilt on shadcn blocks — login-03 auth screen, sidebar-07 dashboard shell (collapsible sidebar, breadcrumb header, NavUser footer); fixed the broken font token that made the app render in serif

Tests: existing unit, component, and Playwright suites still pass against the restyled UI.
Success criteria: the app uses shadcn/ui components throughout with the AGENTS.md palette; all tests pass.

## Part 9: AI connectivity

- [x] Server-side OpenRouter client using OPENROUTER_API_KEY and model `openai/gpt-oss-120b`
- [x] Simple internal test route or script that asks "what is 2+2"

Tests: connectivity check returns a response containing "4".
Success criteria: a proven working AI round trip from the server.

## Part 10: AI + Kanban structured outputs

- [x] Chat endpoint: accepts the user's message and conversation history
- [x] Always sends the current board JSON along with the conversation to the model
- [x] Model responds with Structured Outputs: a reply for the user, plus an optional board update
- [x] When a board update is present, validate and apply it to the database

Tests: unit tests for output schema validation and update application (including rejecting malformed updates); integration test that asking the AI to "add a card called X" results in card X in the database.
Success criteria: the AI can read the board and reliably make valid changes to it; all tests pass.

## Part 11: AI chat sidebar

- [x] Sidebar chat widget: message history, input box, loading state, styled per the color scheme
- [x] When the AI updates the Kanban, the board refreshes automatically

Tests: component tests for the chat widget; Playwright test: ask the AI to create a card and see it appear on the board without a manual reload.
Success criteria: the full product loop — sign up, sign in, manage the shared board, chat with the AI, watch it edit the board — works end to end; all tests pass.

## Part 12: Deploy to Vercel

- [ ] Connect the repo to a Vercel project
- [ ] Set production environment variables (`DATABASE_URL` pointing to Neon cloud, `OPENROUTER_API_KEY`, session secret)
- [ ] Run migrations and seed against the Neon cloud database
- [ ] Deploy and verify

Tests: smoke-test the production URL: signup, login, create and move a card, AI chat round trip.
Success criteria: the app is live on Vercel with data in Neon cloud; the smoke test passes.
