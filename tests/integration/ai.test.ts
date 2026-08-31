// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";

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
const { applyActions } = await import("@/lib/ai-actions");
const { getBoard } = await import("@/lib/board-store");
const { POST: chat } = await import("@/app/api/chat/route");

let columnIds: { todo: string; done: string };

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
  const [user] = await db
    .insert(users)
    .values({ username: "ai-tester", passwordHash: "x" })
    .returning();
  await createSession({ userId: user.id, username: user.username });
});

test("applyActions runs create, update, move, delete against the database", async () => {
  await applyActions([
    { type: "create_card", columnId: columnIds.todo, title: "One", description: "d1" },
    { type: "create_card", columnId: columnIds.todo, title: "Two", description: "" },
  ]);
  let board = await getBoard();
  const one = board.columns[0].cards[0];

  await applyActions([
    { type: "update_card", cardId: one.id, title: "One-b", description: null },
    { type: "move_card", cardId: one.id, toColumnId: columnIds.done, toIndex: null },
  ]);
  board = await getBoard();
  expect(board.columns[0].cards.map((c) => c.title)).toEqual(["Two"]);
  expect(board.columns[1].cards.map((c) => c.title)).toEqual(["One-b"]);
  expect(board.columns[1].cards[0].description).toBe("d1");

  await applyActions([{ type: "delete_card", cardId: one.id }]);
  board = await getBoard();
  expect(board.columns[1].cards).toEqual([]);
});

test("chat endpoint rejects unauthenticated requests", async () => {
  jar.clear();
  const res = await chat(
    new Request("http://test.local", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
    }),
  );
  expect(res.status).toBe(401);
});

test("asking the AI to add a card creates it in the database", { retry: 2, timeout: 60_000 }, async () => {
  const res = await chat(
    new Request("http://test.local", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: 'Add a card called "Water the plants" to the To Do column.',
          },
        ],
      }),
    }),
  );
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body, JSON.stringify(body)).toMatchObject({ applied: true });

  const board = await getBoard();
  expect(
    board.columns[0].cards.some((c) => c.title.includes("Water the plants")),
  ).toBe(true);
});
