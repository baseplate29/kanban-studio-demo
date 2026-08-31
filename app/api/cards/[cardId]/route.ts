import { NextResponse } from "next/server";
import { deleteCard, moveCard, updateCard } from "@/lib/board-store";
import { getSession } from "@/lib/session";

type Params = { params: Promise<{ cardId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cardId } = await params;
  const body = await request.json();

  if (typeof body.toColumnId === "string" && typeof body.toIndex === "number") {
    await moveCard(cardId, body.toColumnId, body.toIndex);
    return NextResponse.json({ ok: true });
  }

  const patch: { title?: string; description?: string } = {};
  if (typeof body.title === "string" && body.title.trim()) {
    patch.title = body.title;
  }
  if (typeof body.description === "string") {
    patch.description = body.description;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Invalid patch" }, { status: 400 });
  }
  await updateCard(cardId, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { cardId } = await params;
  await deleteCard(cardId);
  return NextResponse.json({ ok: true });
}
