# Demo Build Spec

This document instructs Claude Code to build the backend and AI assistant for this app. The styled frontend already exists and works in guest mode with in-memory state. Follow the stages in order — after each stage the app must run, so the demo always has a working checkpoint. Do not restructure or restyle the existing frontend.

**For the human running the demo:** check out `demo-start`, run `npm install`, have Docker running with `postgres:18` pulled, and put `OPENROUTER_API_KEY`, `DATABASE_URL=postgres://postgres:postgres@localhost:5432/kanban`, and `SESSION_SECRET` in `.env` (trailing newline!). **Start from an empty database** — if this machine ran the finished app before, the tables already exist and live migrations will fail: run `docker compose down -v` beforehand (or drop and recreate the `kanban` database). Then paste one prompt: "Read docs/DEMO.md and build stage 1" — then stage 2, then stage 3. Or ask for all three at once. If pressed for time, skip stage 2 (auth); the app works in guest mode without it. The finished reference implementation is on the `main` branch.

## What already exists (do not rebuild)

- Next.js 16 App Router at the repo root, Tailwind v4, shadcn/ui. All dependencies are installed, including drizzle-orm, drizzle-kit, pg, bcryptjs, jose, tsx.
- `lib/board.ts` — Board/Column/Card types and pure state operations.
- `lib/board-api.ts` — the fetch layer the UI already calls. The endpoints it expects are the contract in stage 1.
- `components/board-view.tsx` — board UI with drag and drop, optimistic updates via a serialized request queue, 3-second polling of `GET /api/board`, and a `refreshSignal` prop that forces a refetch (used by the AI chat in stage 3).
- `components/auth-forms.tsx` — login/signup screen (`AuthScreen`). It calls `signup` and `login` from `app/auth-actions.ts` via `useActionState`; those are currently stubs.
- `components/app-sidebar.tsx` / `nav-user.tsx` — app shell; `NavUser` calls the `logout` action. `AppSidebar` takes a `username` prop.
- `app/page.tsx` — guest mode with a hardcoded empty board. Stage 2 replaces this.
- `components/workspace.tsx` — renders `BoardView` only. Stage 3 adds the chat sidebar here.
- `next.config.ts` already allows Server Actions from `*.app.github.dev`.

## Stage 1: Postgres persistence

1. `docker-compose.yml`: official `postgres:18` image, database `kanban`, password `postgres`, port 5432, named volume mounted at `/var/lib/postgresql`.
2. Drizzle schema in `lib/db/schema.ts`, all ids `uuid` with `defaultRandom()`:
   - `users`: id, username (unique, not null), password_hash (not null), created_at timestamptz default now
   - `boards`: id, name (not null)
   - `columns`: id, board_id FK -> boards cascade delete, name, position integer
   - `cards`: id, column_id FK -> columns cascade delete, title, description (not null, default ''), position integer, created_at
3. `lib/db/index.ts`: pg Pool from `DATABASE_URL` + drizzle instance. `drizzle.config.ts` uses `process.loadEnvFile(".env")` (drizzle-kit does not load .env itself). Add npm scripts: `db:generate`, `db:migrate`, `db:seed` (seed via `tsx --env-file=.env`; no top-level await — wrap in `async function main()`).
4. Seed: create one board ("Shared Board") with columns To Do / In Progress / Done at positions 0/1/2, plus a few sample cards. Idempotent — skip if a board exists.
5. `lib/board-store.ts`: `getBoard()` (first board row is THE board; columns and cards ordered by position), `renameColumn`, `createCard` (accept optional client-supplied id; position = max+1 in column), `updateCard`, `deleteCard`, `moveCard(cardId, toColumnId, toIndex)` (transaction: remove from source, splice into target order, renumber target column). Last-write-wins, no locking.
6. Route handlers (return 401 `{error}` when there is no session — until stage 2 exists, a `getSession()` that returns a fake session is fine, or gate only after stage 2; pick the simplest that keeps stages independent):
   - `GET /api/board` -> `{ "columns": [ { "id", "name", "cards": [ { "id", "title", "description" } ] } ] }`
   - `PATCH /api/columns/[columnId]` body `{ name }` (400 on empty)
   - `POST /api/cards` body `{ id?, columnId, title, description? }` (400 on empty title)
   - `PATCH /api/cards/[cardId]` body `{ title?, description? }` to edit OR `{ toColumnId, toIndex }` to move
   - `DELETE /api/cards/[cardId]`
7. Do NOT change `lib/board-api.ts` — it already matches this contract exactly.
8. Update `app/page.tsx` to load the board server-side from the store instead of the hardcoded one (keep guest mode / no auth until stage 2).

Checkpoint: `docker compose up -d`, migrate, seed, `npm run dev` — create and drag a card, reload the page, it persists.

## Stage 2: Auth (skippable)

1. `lib/password.ts`: bcryptjs `hashPassword`/`verifyPassword` and `validateSignup` (username >= 3 chars, password >= 8 chars, return error string or null).
2. `lib/session.ts`: jose HS256 JWT (`SESSION_SECRET`) in an HTTP-only cookie named `session`, sameSite lax, 7 days; `createSession({userId, username})`, `getSession()`, `destroySession()`.
3. Implement `app/auth-actions.ts` for real: `signup(prev, formData)` and `login(prev, formData)` returning an error string or null ("Username is already taken", "Invalid username or password"), creating the session and `revalidatePath("/")` on success; `logout()` destroys the session AND also calls `revalidatePath("/")` — `NavUser` triggers it without navigation, so without the revalidate the UI never flips back to the auth screen. Keep the exported names and shapes — the UI already uses them.
4. `app/page.tsx`: no session -> render `AuthScreen`; with session -> current shell with `username={session.username}`.
5. Gate every route handler from stage 1 behind `getSession()` -> 401.

Checkpoint: signup, logout via the avatar menu, login again; board only reachable when signed in.

## Stage 3: AI assistant

1. `lib/ai.ts`: `chatCompletion(messages, responseFormat?)` — plain fetch to `https://openrouter.ai/api/v1/chat/completions`, model `openai/gpt-oss-120b`, bearer `OPENROUTER_API_KEY`. **When sending `response_format`, also send `provider: { require_parameters: true }`** — otherwise OpenRouter may route to a provider that silently ignores structured outputs and returns free-form JSON.
2. `lib/ai-actions.ts`: a JSON-schema `RESPONSE_FORMAT` (strict json_schema) for `{ reply: string, actions: [...] }` where each action is one of:
   - `{ type: "create_card", columnId, title, description }`
   - `{ type: "update_card", cardId, title: string|null, description: string|null }` (null = unchanged)
   - `{ type: "move_card", cardId, toColumnId, toIndex: integer|null }` (null = end)
   - `{ type: "delete_card", cardId }`
   Plus `parseAiResponse(text)` (structural validation, null on malformed), `validateActions(actions, board)` (ids must exist, titles non-empty), and `applyActions(actions)` calling the stage 1 store functions.
3. `POST /api/chat`: session-gated; body `{ messages: [{role: "user"|"assistant", content}] }`; system prompt contains the current board JSON (with real ids), tells the model to use exact ids and return empty actions for pure conversation, and spells out the JSON response shape as a fallback; call `chatCompletion` with `RESPONSE_FORMAT`; parse -> validate -> apply; respond `{ reply, applied: boolean }` (applied = actions were applied). On a malformed model response, reply "Sorry, I could not process that request." with applied false; if actions parse but fail validation, return the model's reply with applied false and apply nothing (all-or-nothing) — never 500. Tell the model in the system prompt to use no emojis in replies.
4. `components/chat-sidebar.tsx`: `ChatSidebar({ onBoardChanged, className? })` — header with a bot avatar and "AI Assistant", scrollable message list (user bubbles right in `bg-primary`, assistant left with bot avatar in `bg-muted`), empty state, "Thinking..." loading state, input + Send (`type="submit"`). Keep full history in state and send it all each turn. Auto-scroll the list to the bottom on new messages. Call `onBoardChanged()` when the response has `applied: true`.
5. Wire into `components/workspace.tsx`: desktop — chat as a fixed `w-80` right panel; mobile (`useIsMobile`) — floating bot button bottom-right opening the chat in a right-side `Sheet` (chat gets `className="h-full w-full border-l-0"`, add an sr-only SheetTitle). `onBoardChanged` increments a counter passed to `BoardView`'s existing `refreshSignal` prop.

Checkpoint: ask the chat to "add three cards for launch prep and move one to In Progress" — cards appear on the board without a reload.

## Rules and gotchas (treat as constraints)

- Match the existing code style; no emojis anywhere; keep it simple, no over-engineering, no extra features beyond this spec.
- shadcn here is Base UI-based: a `<Button>` that submits a form MUST have explicit `type="submit"`; `DropdownMenuLabel` must sit inside `DropdownMenuGroup`.
- `.env` edits: never append without checking the trailing newline.
- Next 16 allows one dev server per project — do not start a second one; the running one hot-reloads.
- Model output is nondeterministic: if an AI reply comes back as junk during verification, retry once rather than debugging.
- Verify with `npm run lint` and `npm test` (frontend unit tests must stay green) after each stage; write new tests only if explicitly asked — demo time is limited.
