import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";

// E2E runs against its own server on the kanban_test database (see
// playwright.config.ts), so resetting here never touches dev data.
export default async function setup() {
  process.loadEnvFile(".env");
  const url = process.env.DATABASE_URL!;

  const admin = new Client({ connectionString: url });
  await admin.connect();
  const { rowCount } = await admin.query(
    "select 1 from pg_database where datname = 'kanban_test'",
  );
  if (!rowCount) await admin.query("create database kanban_test");
  await admin.end();

  const client = new Client({
    connectionString: url.replace("/kanban", "/kanban_test"),
  });
  await client.connect();
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
  await client.query("delete from cards");
  await client.query("delete from columns");
  await client.query("delete from boards");
  const board = await client.query(
    "insert into boards (name) values ('Shared Board') returning id",
  );
  await client.query(
    `insert into columns (board_id, name, position)
     values ($1, 'To Do', 0), ($1, 'In Progress', 1), ($1, 'Done', 2)`,
    [board.rows[0].id],
  );
  await client.end();
}
