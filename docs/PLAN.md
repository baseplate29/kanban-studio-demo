# Project Plan

Detailed plan for building the Project Management MVP. Each part has a checklist to be checked off as work completes, plus tests and success criteria. Parts are done in order; a part is not started until the previous part's success criteria are met.

Stack (see AGENTS.md): full-stack Next.js (App Router, TypeScript) at the repo root, Postgres via the `pg` driver and Drizzle ORM (plain Postgres in Docker for development, Neon in production), in-app signup/password auth, OpenRouter for AI, deployed to Vercel.

Prerequisites the user must provide:
- Docker Desktop running locally — needed from Part 4
- `OPENROUTER_API_KEY` in `.env` — needed from Part 8
- A Vercel account and a Neon project (its connection string becomes the production `DATABASE_URL`) — needed from Part 11

Note: auth (Part 5) comes after the database (Part 4) because signup needs the users table.

## Part 1: Plan

- [x] Rewrite AGENTS.md for the Next.js + Neon stack
- [x] Remove obsolete backend/ and scripts/ placeholders
- [x] Enrich this document with substeps, tests, and success criteria
- [x] Update plan for multi-user shared board, Neon Local via Docker, and Vercel deployment
- [x] User reviews and approves the plan

Success criteria: user approves this plan. Approved 2026-08-31.

## Part 2: Scaffolding

- [ ] Scaffold a Next.js app (App Router, TypeScript, Tailwind) at the repo root
- [ ] Add the color scheme from AGENTS.md as CSS variables / Tailwind theme tokens
- [ ] Set up test tooling: Vitest + React Testing Library for unit/component tests, Playwright for end-to-end tests
- [ ] Minimal home page renders

Tests: one smoke test that the home page renders; one trivial Playwright test that / loads.
Success criteria: `npm run dev` serves the app at /, `npm test` and `npm run lint` pass.

## Part 3: Kanban board UI

- [ ] Define TypeScript types for the board (columns, cards)
- [ ] Board with fixed columns (To Do, In Progress, Done) that can be renamed inline
- [ ] Cards: create, edit title/description, delete
- [ ] Drag and drop cards within and between columns
- [ ] Local state only at this stage; styled per the color scheme

Tests: unit tests for all board state operations (rename column, card CRUD, move card); component tests for column rename and card create/edit; Playwright test for a drag-and-drop move.
Success criteria: full board interaction works in the browser; all tests pass.

## Part 4: Database

- [ ] docker-compose.yml running the official `postgres` image, exposing localhost:5432; app connects via `DATABASE_URL` in `.env`
- [ ] Design schema: users, boards, columns, cards — one shared board for the MVP, but boards as a table so more can exist later
- [ ] Define the schema with Drizzle ORM
- [ ] Document the schema and approach in docs/DATABASE.md and get user sign-off
- [ ] Apply the schema with Drizzle migrations
- [ ] Seed the shared board with its default columns

Tests: migrations apply cleanly to a fresh database; seed script is idempotent.
Success criteria: user approves docs/DATABASE.md; `docker compose up` gives a working local Postgres database with tables and seed data.

## Part 5: User accounts

- [ ] Signup form: username + password, password hashed with bcrypt, user stored in the database
- [ ] Login form shown at / when not signed in; the shared board shown when signed in
- [ ] Session kept in a signed HTTP-only cookie; log out clears it
- [ ] Duplicate username and wrong credentials show error messages

Tests: unit tests for password hashing/verification and signup validation; Playwright tests for: signup then login, board hidden when signed out, failed login shows error, duplicate signup rejected, logout returns to login form.
Success criteria: two different users can each sign up and log in; the board is only reachable through login; all tests pass.

## Part 6: API layer

- [ ] Route Handlers / Server Actions for: get board, rename column, create card, edit card, delete card, move card
- [ ] Every operation requires a valid session; all users operate on the shared board
- [ ] Concurrent edits are last-write-wins; no locking

Tests: integration tests against a test database covering each operation, plus rejection of unauthenticated requests; test that two users' edits both land on the shared board.
Success criteria: all board operations read/write the database correctly; all tests pass.

## Part 7: Frontend + API

- [ ] Board loads from the database on sign-in
- [ ] All mutations (rename, card CRUD, drag and drop) persist through the API layer
- [ ] Optimistic updates so drag and drop stays smooth
- [ ] Polling refresh (every few seconds) so other users' changes appear without a manual reload

Tests: Playwright test: log in, create a card, move it, reload the page — the change persists; Playwright test with two sessions: user A creates a card, user B sees it appear via polling; unit tests for the data-fetching/mutation layer.
Success criteria: the board fully survives page reloads and reflects other users' edits; all tests pass.

## Part 8: AI connectivity

- [ ] Server-side OpenRouter client using OPENROUTER_API_KEY and model `openai/gpt-oss-120b`
- [ ] Simple internal test route or script that asks "what is 2+2"

Tests: connectivity check returns a response containing "4".
Success criteria: a proven working AI round trip from the server.

## Part 9: AI + Kanban structured outputs

- [ ] Chat endpoint: accepts the user's message and conversation history
- [ ] Always sends the current board JSON along with the conversation to the model
- [ ] Model responds with Structured Outputs: a reply for the user, plus an optional board update
- [ ] When a board update is present, validate and apply it to the database

Tests: unit tests for output schema validation and update application (including rejecting malformed updates); integration test that asking the AI to "add a card called X" results in card X in the database.
Success criteria: the AI can read the board and reliably make valid changes to it; all tests pass.

## Part 10: AI chat sidebar

- [ ] Sidebar chat widget: message history, input box, loading state, styled per the color scheme
- [ ] When the AI updates the Kanban, the board refreshes automatically

Tests: component tests for the chat widget; Playwright test: ask the AI to create a card and see it appear on the board without a manual reload.
Success criteria: the full product loop — sign up, sign in, manage the shared board, chat with the AI, watch it edit the board — works end to end; all tests pass.

## Part 11: Deploy to Vercel

- [ ] Connect the repo to a Vercel project
- [ ] Set production environment variables (`DATABASE_URL` pointing to Neon cloud, `OPENROUTER_API_KEY`, session secret)
- [ ] Run migrations and seed against the Neon cloud database
- [ ] Deploy and verify

Tests: smoke-test the production URL: signup, login, create and move a card, AI chat round trip.
Success criteria: the app is live on Vercel with data in Neon cloud; the smoke test passes.
