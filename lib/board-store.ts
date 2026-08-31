import { asc, eq, sql } from "drizzle-orm";
import type { Board } from "./board";
import { db } from "./db";
import { boards, cards, columns } from "./db/schema";

export async function getBoard(): Promise<Board> {
  const [board] = await db.select().from(boards).limit(1);
  if (!board) throw new Error("Board not seeded");
  const cols = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, board.id))
    .orderBy(asc(columns.position));
  const allCards = await db
    .select()
    .from(cards)
    .orderBy(asc(cards.position));
  return {
    columns: cols.map((col) => ({
      id: col.id,
      name: col.name,
      cards: allCards
        .filter((card) => card.columnId === col.id)
        .map(({ id, title, description }) => ({ id, title, description })),
    })),
  };
}

export async function renameColumn(columnId: string, name: string) {
  await db.update(columns).set({ name }).where(eq(columns.id, columnId));
}

export async function createCard(
  columnId: string,
  card: { id?: string; title: string; description?: string },
) {
  await db.insert(cards).values({
    id: card.id,
    columnId,
    title: card.title,
    description: card.description ?? "",
    position: sql`(select coalesce(max(${cards.position}), -1) + 1 from ${cards} where ${cards.columnId} = ${columnId})`,
  });
}

export async function updateCard(
  cardId: string,
  patch: { title?: string; description?: string },
) {
  await db.update(cards).set(patch).where(eq(cards.id, cardId));
}

export async function deleteCard(cardId: string) {
  await db.delete(cards).where(eq(cards.id, cardId));
}

export async function moveCard(
  cardId: string,
  toColumnId: string,
  toIndex: number,
) {
  await db.transaction(async (tx) => {
    const [card] = await tx.select().from(cards).where(eq(cards.id, cardId));
    if (!card) return;
    const target = await tx
      .select()
      .from(cards)
      .where(eq(cards.columnId, toColumnId))
      .orderBy(asc(cards.position));
    const list = target.filter((c) => c.id !== cardId);
    list.splice(Math.min(toIndex, list.length), 0, card);
    for (const [i, c] of list.entries()) {
      await tx
        .update(cards)
        .set({ position: i, columnId: toColumnId })
        .where(eq(cards.id, c.id));
    }
  });
}
