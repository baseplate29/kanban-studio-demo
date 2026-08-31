import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { Board } from "@/lib/board";
import { BoardView } from "./board-view";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
  );
});

function makeBoard(): Board {
  return {
    columns: [
      {
        id: "todo",
        name: "To Do",
        cards: [{ id: "a", title: "Card A", description: "" }],
      },
      { id: "done", name: "Done", cards: [] },
    ],
  };
}

test("renames a column inline", async () => {
  const user = userEvent.setup();
  render(<BoardView initialBoard={makeBoard()} />);
  const input = screen.getAllByLabelText("Column name")[0];
  await user.clear(input);
  await user.type(input, "Backlog");
  expect(input).toHaveValue("Backlog");
});

test("creates a card", async () => {
  const user = userEvent.setup();
  render(<BoardView initialBoard={makeBoard()} />);
  await user.click(screen.getAllByText("+ Add card")[1]);
  await user.type(screen.getByLabelText("New card title"), "New task{Enter}");
  expect(screen.getByText("New task")).toBeInTheDocument();
});

test("edits a card", async () => {
  const user = userEvent.setup();
  render(<BoardView initialBoard={makeBoard()} />);
  await user.click(screen.getByText("Card A"));
  const title = screen.getByLabelText("Card title");
  await user.clear(title);
  await user.type(title, "Card A2");
  await user.type(screen.getByLabelText("Card description"), "details");
  await user.click(screen.getByText("Save"));
  expect(screen.getByText("Card A2")).toBeInTheDocument();
  expect(screen.getByText("details")).toBeInTheDocument();
});

test("deletes a card", async () => {
  const user = userEvent.setup();
  render(<BoardView initialBoard={makeBoard()} />);
  await user.click(screen.getByText("Card A"));
  await user.click(screen.getByText("Delete"));
  expect(screen.queryByText("Card A")).not.toBeInTheDocument();
});
