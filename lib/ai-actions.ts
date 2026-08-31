import type { Board } from "./board";
import { createCard, deleteCard, moveCard, updateCard } from "./board-store";

export type AiAction =
  | { type: "create_card"; columnId: string; title: string; description: string }
  | { type: "update_card"; cardId: string; title: string | null; description: string | null }
  | { type: "move_card"; cardId: string; toColumnId: string; toIndex: number | null }
  | { type: "delete_card"; cardId: string };

export type AiResponse = { reply: string; actions: AiAction[] };

export const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "kanban_response",
    strict: true,
    schema: {
      type: "object",
      properties: {
        reply: { type: "string" },
        actions: {
          type: "array",
          items: {
            anyOf: [
              {
                type: "object",
                properties: {
                  type: { const: "create_card" },
                  columnId: { type: "string" },
                  title: { type: "string" },
                  description: { type: "string" },
                },
                required: ["type", "columnId", "title", "description"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: { const: "update_card" },
                  cardId: { type: "string" },
                  title: { type: ["string", "null"] },
                  description: { type: ["string", "null"] },
                },
                required: ["type", "cardId", "title", "description"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: { const: "move_card" },
                  cardId: { type: "string" },
                  toColumnId: { type: "string" },
                  toIndex: { type: ["integer", "null"] },
                },
                required: ["type", "cardId", "toColumnId", "toIndex"],
                additionalProperties: false,
              },
              {
                type: "object",
                properties: {
                  type: { const: "delete_card" },
                  cardId: { type: "string" },
                },
                required: ["type", "cardId"],
                additionalProperties: false,
              },
            ],
          },
        },
      },
      required: ["reply", "actions"],
      additionalProperties: false,
    },
  },
};

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function isAction(a: unknown): a is AiAction {
  if (typeof a !== "object" || a === null) return false;
  const o = a as Record<string, unknown>;
  switch (o.type) {
    case "create_card":
      return isString(o.columnId) && isString(o.title) && isString(o.description);
    case "update_card":
      return (
        isString(o.cardId) &&
        (isString(o.title) || o.title === null) &&
        (isString(o.description) || o.description === null)
      );
    case "move_card":
      return (
        isString(o.cardId) &&
        isString(o.toColumnId) &&
        (Number.isInteger(o.toIndex) || o.toIndex === null)
      );
    case "delete_card":
      return isString(o.cardId);
    default:
      return false;
  }
}

export function parseAiResponse(text: string): AiResponse | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const o = data as Record<string, unknown>;
  if (!isString(o.reply) || !Array.isArray(o.actions)) return null;
  if (!o.actions.every(isAction)) return null;
  return { reply: o.reply, actions: o.actions as AiAction[] };
}

export function validateActions(actions: AiAction[], board: Board): string | null {
  const columnIds = new Set(board.columns.map((c) => c.id));
  const cardIds = new Set(board.columns.flatMap((c) => c.cards.map((k) => k.id)));
  for (const action of actions) {
    if ("columnId" in action && !columnIds.has(action.columnId)) {
      return `Unknown column: ${action.columnId}`;
    }
    if ("toColumnId" in action && !columnIds.has(action.toColumnId)) {
      return `Unknown column: ${action.toColumnId}`;
    }
    if ("cardId" in action && !cardIds.has(action.cardId)) {
      return `Unknown card: ${action.cardId}`;
    }
    if (action.type === "create_card" && !action.title.trim()) {
      return "Card title cannot be empty";
    }
  }
  return null;
}

export async function applyActions(actions: AiAction[]) {
  for (const action of actions) {
    switch (action.type) {
      case "create_card":
        await createCard(action.columnId, {
          title: action.title,
          description: action.description,
        });
        break;
      case "update_card":
        await updateCard(action.cardId, {
          ...(action.title !== null && { title: action.title }),
          ...(action.description !== null && { description: action.description }),
        });
        break;
      case "move_card":
        await moveCard(action.cardId, action.toColumnId, action.toIndex ?? 1e9);
        break;
      case "delete_card":
        await deleteCard(action.cardId);
        break;
    }
  }
}
