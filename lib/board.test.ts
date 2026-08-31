import { describe, expect, test } from "vitest";
import {
  Board,
  createCard,
  deleteCard,
  moveCard,
  renameColumn,
  updateCard,
} from "./board";

function makeBoard(): Board {
  return {
    columns: [
      {
        id: "todo",
        name: "To Do",
        cards: [
          { id: "a", title: "Card A", description: "" },
          { id: "b", title: "Card B", description: "" },
        ],
      },
      { id: "done", name: "Done", cards: [{ id: "c", title: "Card C", description: "" }] },
    ],
  };
}

describe("renameColumn", () => {
  test("renames the target column only", () => {
    const board = renameColumn(makeBoard(), "todo", "Backlog");
    expect(board.columns[0].name).toBe("Backlog");
    expect(board.columns[1].name).toBe("Done");
  });
});

describe("createCard", () => {
  test("appends a card to the target column", () => {
    const board = createCard(makeBoard(), "done", {
      id: "d",
      title: "Card D",
      description: "desc",
    });
    expect(board.columns[1].cards.map((c) => c.id)).toEqual(["c", "d"]);
  });
});

describe("updateCard", () => {
  test("patches title and description", () => {
    const board = updateCard(makeBoard(), "b", {
      title: "New B",
      description: "notes",
    });
    expect(board.columns[0].cards[1]).toEqual({
      id: "b",
      title: "New B",
      description: "notes",
    });
  });
});

describe("deleteCard", () => {
  test("removes the card", () => {
    const board = deleteCard(makeBoard(), "a");
    expect(board.columns[0].cards.map((c) => c.id)).toEqual(["b"]);
  });
});

describe("moveCard", () => {
  test("moves a card to another column at an index", () => {
    const board = moveCard(makeBoard(), "a", "done", 0);
    expect(board.columns[0].cards.map((c) => c.id)).toEqual(["b"]);
    expect(board.columns[1].cards.map((c) => c.id)).toEqual(["a", "c"]);
  });

  test("reorders within the same column", () => {
    const board = moveCard(makeBoard(), "a", "todo", 1);
    expect(board.columns[0].cards.map((c) => c.id)).toEqual(["b", "a"]);
  });

  test("returns board unchanged for unknown card", () => {
    const board = makeBoard();
    expect(moveCard(board, "nope", "done", 0)).toEqual(board);
  });
});
