// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";

const jar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name)! } : undefined,
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

process.loadEnvFile(".env");
process.env.DATABASE_URL = process.env.DATABASE_URL!.replace(
  "/kanban",
  "/kanban_test",
);

const { db } = await import("@/lib/db");
const { boards, cards, columns, users } = await import("@/lib/db/schema");
const { createSession } = await import("@/lib/session");
const { GET: getBoardRoute } = await import("@/app/api/board/route");
const { PATCH: patchColumn } = await import(
  "@/app/api/columns/[columnId]/route"
);
const { POST: postCard } = await import("@/app/api/cards/route");
const { PATCH: patchCard, DELETE: deleteCardRoute } = await import(
  "@/app/api/cards/[cardId]/route"
);

let columnIds: { todo: string; done: string };

async function loginAs(username: string) {
  const [user] = await db
    .insert(users)
    .values({ username, passwordHash: "x" })
    .returning();
  await createSession({ userId: user.id, username });
}

function jsonRequest(method: string, body: unknown) {
  return new Request("http://test.local", {
    method,
    body: JSON.stringify(body),
  });
}

async function boardState() {
  const res = await getBoardRoute();
  return res.json();
}

beforeEach(async () => {
  jar.clear();
  await db.delete(cards);
  await db.delete(columns);
  await db.delete(boards);
  await db.delete(users);
  const [board] = await db
    .insert(boards)
    .values({ name: "Shared Board" })
    .returning();
  const inserted = await db
    .insert(columns)
    .values([
      { boardId: board.id, name: "To Do", position: 0 },
      { boardId: board.id, name: "Done", position: 1 },
    ])
    .returning();
  columnIds = { todo: inserted[0].id, done: inserted[1].id };
  await loginAs("tester");
});

describe("authentication", () => {
  test("all routes reject unauthenticated requests", async () => {
    jar.clear();
    const responses = await Promise.all([
      getBoardRoute(),
      patchColumn(jsonRequest("PATCH", { name: "X" }), {
        params: Promise.resolve({ columnId: columnIds.todo }),
      }),
      postCard(jsonRequest("POST", { columnId: columnIds.todo, title: "X" })),
      patchCard(jsonRequest("PATCH", { title: "X" }), {
        params: Promise.resolve({ cardId: "00000000-0000-0000-0000-000000000000" }),
      }),
      deleteCardRoute(jsonRequest("DELETE", {}), {
        params: Promise.resolve({ cardId: "00000000-0000-0000-0000-000000000000" }),
      }),
    ]);
    for (const res of responses) expect(res.status).toBe(401);
  });
});

describe("board operations", () => {
  test("get board returns columns in order", async () => {
    const board = await boardState();
    expect(board.columns.map((c: { name: string }) => c.name)).toEqual([
      "To Do",
      "Done",
    ]);
  });

  test("rename column", async () => {
    const res = await patchColumn(jsonRequest("PATCH", { name: "Backlog" }), {
      params: Promise.resolve({ columnId: columnIds.todo }),
    });
    expect(res.status).toBe(200);
    const board = await boardState();
    expect(board.columns[0].name).toBe("Backlog");
  });

  test("rename column rejects empty name", async () => {
    const res = await patchColumn(jsonRequest("PATCH", { name: "  " }), {
      params: Promise.resolve({ columnId: columnIds.todo }),
    });
    expect(res.status).toBe(400);
  });

  test("create, edit, move, delete a card", async () => {
    await postCard(
      jsonRequest("POST", { columnId: columnIds.todo, title: "Task 1" }),
    );
    await postCard(
      jsonRequest("POST", { columnId: columnIds.todo, title: "Task 2" }),
    );
    let board = await boardState();
    const [task1, task2] = board.columns[0].cards;
    expect([task1.title, task2.title]).toEqual(["Task 1", "Task 2"]);

    await patchCard(
      jsonRequest("PATCH", { title: "Task 1b", description: "notes" }),
      { params: Promise.resolve({ cardId: task1.id }) },
    );
    board = await boardState();
    expect(board.columns[0].cards[0]).toMatchObject({
      title: "Task 1b",
      description: "notes",
    });

    await patchCard(
      jsonRequest("PATCH", { toColumnId: columnIds.done, toIndex: 0 }),
      { params: Promise.resolve({ cardId: task1.id }) },
    );
    board = await boardState();
    expect(board.columns[0].cards.map((c: { id: string }) => c.id)).toEqual([
      task2.id,
    ]);
    expect(board.columns[1].cards.map((c: { id: string }) => c.id)).toEqual([
      task1.id,
    ]);

    await deleteCardRoute(jsonRequest("DELETE", {}), {
      params: Promise.resolve({ cardId: task2.id }),
    });
    board = await boardState();
    expect(board.columns[0].cards).toEqual([]);
  });

  test("move reorders within the same column", async () => {
    await postCard(jsonRequest("POST", { columnId: columnIds.todo, title: "A" }));
    await postCard(jsonRequest("POST", { columnId: columnIds.todo, title: "B" }));
    let board = await boardState();
    const cardA = board.columns[0].cards[0];

    await patchCard(
      jsonRequest("PATCH", { toColumnId: columnIds.todo, toIndex: 1 }),
      { params: Promise.resolve({ cardId: cardA.id }) },
    );
    board = await boardState();
    expect(board.columns[0].cards.map((c: { title: string }) => c.title)).toEqual(
      ["B", "A"],
    );
  });

  test("create card rejects missing title", async () => {
    const res = await postCard(
      jsonRequest("POST", { columnId: columnIds.todo, title: "" }),
    );
    expect(res.status).toBe(400);
  });

  test("two users' edits both land on the shared board", async () => {
    await postCard(
      jsonRequest("POST", { columnId: columnIds.todo, title: "From tester" }),
    );
    jar.clear();
    await loginAs("second-user");
    await postCard(
      jsonRequest("POST", { columnId: columnIds.todo, title: "From second" }),
    );
    const board = await boardState();
    expect(board.columns[0].cards.map((c: { title: string }) => c.title)).toEqual(
      ["From tester", "From second"],
    );
  });
});
