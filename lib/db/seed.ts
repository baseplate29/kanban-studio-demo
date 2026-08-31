import { db } from "./index";
import { boards, columns } from "./schema";

async function seed() {
  const existing = await db.select().from(boards).limit(1);
  if (existing.length > 0) {
    console.log("Board already seeded, skipping.");
    return;
  }
  const [board] = await db
    .insert(boards)
    .values({ name: "Shared Board" })
    .returning();
  await db.insert(columns).values([
    { boardId: board.id, name: "To Do", position: 0 },
    { boardId: board.id, name: "In Progress", position: 1 },
    { boardId: board.id, name: "Done", position: 2 },
  ]);
  console.log("Seeded shared board with default columns.");
}

seed().then(() => process.exit(0));
