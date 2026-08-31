# Database

Postgres, accessed through the `pg` driver with Drizzle ORM. Local development runs the official `postgres:18` image via `docker compose up`; production uses Neon. The app always connects through `DATABASE_URL` in `.env`.

## Schema

Four tables. The MVP has one shared board, but boards are a table so more can exist later.

### users
| column | type | notes |
|---|---|---|
| id | uuid | PK, random default |
| username | text | unique, not null |
| password_hash | text | bcrypt hash, not null |
| created_at | timestamptz | default now() |

### boards
| column | type | notes |
|---|---|---|
| id | uuid | PK, random default |
| name | text | not null |

### columns
| column | type | notes |
|---|---|---|
| id | uuid | PK, random default |
| board_id | uuid | FK boards.id, cascade delete |
| name | text | not null |
| position | integer | 0-based order within the board |

### cards
| column | type | notes |
|---|---|---|
| id | uuid | PK, random default |
| column_id | uuid | FK columns.id, cascade delete |
| title | text | not null |
| description | text | not null, default '' |
| position | integer | 0-based order within the column |
| created_at | timestamptz | default now() |

## Approach

- Ordering: integer `position` per column/card. Moving a card rewrites positions in the affected column(s). Simple and adequate at MVP scale.
- Concurrency: last-write-wins, no locking or version columns. Polling keeps clients roughly in sync.
- The app treats the first (only) row in `boards` as the shared board.
- Migrations: generated and applied with drizzle-kit (`npm run db:generate`, `npm run db:migrate`); SQL lives in `drizzle/`.
- Seed: `npm run db:seed` creates the shared board with columns To Do, In Progress, Done. Idempotent — it skips if a board exists.
