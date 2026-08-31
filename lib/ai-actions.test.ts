import { expect, test } from "vitest";
import { parseAiResponse, validateActions } from "./ai-actions";
import { Board } from "./board";

const board: Board = {
  columns: [
    {
      id: "col-1",
      name: "To Do",
      cards: [{ id: "card-1", title: "A", description: "" }],
    },
    { id: "col-2", name: "Done", cards: [] },
  ],
};

test("parses a valid response with actions", () => {
  const parsed = parseAiResponse(
    JSON.stringify({
      reply: "Done",
      actions: [
        { type: "create_card", columnId: "col-1", title: "X", description: "" },
        { type: "update_card", cardId: "card-1", title: "B", description: null },
        { type: "move_card", cardId: "card-1", toColumnId: "col-2", toIndex: null },
        { type: "delete_card", cardId: "card-1" },
      ],
    }),
  );
  expect(parsed).not.toBeNull();
  expect(parsed!.actions).toHaveLength(4);
});

test("parses a reply with no actions", () => {
  expect(parseAiResponse('{"reply":"Hi","actions":[]}')).toEqual({
    reply: "Hi",
    actions: [],
  });
});

test("rejects malformed responses", () => {
  expect(parseAiResponse("not json")).toBeNull();
  expect(parseAiResponse('"just a string"')).toBeNull();
  expect(parseAiResponse('{"reply":"x"}')).toBeNull();
  expect(parseAiResponse('{"actions":[]}')).toBeNull();
  expect(
    parseAiResponse('{"reply":"x","actions":[{"type":"unknown_action"}]}'),
  ).toBeNull();
  expect(
    parseAiResponse('{"reply":"x","actions":[{"type":"create_card","title":"T"}]}'),
  ).toBeNull();
  expect(
    parseAiResponse(
      '{"reply":"x","actions":[{"type":"move_card","cardId":"c","toColumnId":"k","toIndex":1.5}]}',
    ),
  ).toBeNull();
});

test("validateActions accepts actions referencing real ids", () => {
  expect(
    validateActions(
      [
        { type: "create_card", columnId: "col-2", title: "X", description: "" },
        { type: "move_card", cardId: "card-1", toColumnId: "col-2", toIndex: 0 },
      ],
      board,
    ),
  ).toBeNull();
});

test("validateActions rejects unknown ids and empty titles", () => {
  expect(
    validateActions(
      [{ type: "create_card", columnId: "nope", title: "X", description: "" }],
      board,
    ),
  ).toMatch(/Unknown column/);
  expect(
    validateActions([{ type: "delete_card", cardId: "nope" }], board),
  ).toMatch(/Unknown card/);
  expect(
    validateActions(
      [{ type: "create_card", columnId: "col-1", title: "  ", description: "" }],
      board,
    ),
  ).toMatch(/title/);
});
