import { NextResponse } from "next/server";
import { chatCompletion, ChatMessage } from "@/lib/ai";
import {
  applyActions,
  parseAiResponse,
  RESPONSE_FORMAT,
  validateActions,
} from "@/lib/ai-actions";
import type { Board } from "@/lib/board";
import { getBoard } from "@/lib/board-store";
import { getSession } from "@/lib/session";

function systemPrompt(board: Board) {
  return `You are the AI assistant for a shared kanban board. You can create, edit, move, and delete cards using actions.

Current board state (columns in order, cards in order within each column):
${JSON.stringify(board)}

Rules:
- Use the exact column and card ids from the board state above.
- When the user asks for board changes, include the matching actions; otherwise return an empty actions array.
- For move_card, toIndex is the target position within the column, or null for the end.
- For update_card, use null for a field you are not changing.
- "reply" is a short message to the user describing what you did or answering their question.

Respond with a single JSON object: {"reply": string, "actions": [...]}. Each action is one of:
{"type":"create_card","columnId":string,"title":string,"description":string}
{"type":"update_card","cardId":string,"title":string|null,"description":string|null}
{"type":"move_card","cardId":string,"toColumnId":string,"toIndex":integer|null}
{"type":"delete_card","cardId":string}`;
}

function isChatMessage(m: unknown): m is ChatMessage {
  if (typeof m !== "object" || m === null) return false;
  const o = m as Record<string, unknown>;
  return (
    (o.role === "user" || o.role === "assistant") &&
    typeof o.content === "string"
  );
}

export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { messages } = await request.json();
  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
  }

  const board = await getBoard();
  const text = await chatCompletion(
    [{ role: "system", content: systemPrompt(board) }, ...messages],
    RESPONSE_FORMAT,
  );

  const parsed = parseAiResponse(text);
  if (!parsed) {
    return NextResponse.json({
      reply: "Sorry, I could not process that request.",
      applied: false,
    });
  }
  const error = validateActions(parsed.actions, board);
  if (error) {
    return NextResponse.json({ reply: parsed.reply, applied: false, error });
  }
  await applyActions(parsed.actions);
  return NextResponse.json({
    reply: parsed.reply,
    applied: parsed.actions.length > 0,
  });
}
