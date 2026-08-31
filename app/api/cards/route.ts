import { NextResponse } from "next/server";
import { createCard } from "@/lib/board-store";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, columnId, title, description } = await request.json();
  if (typeof columnId !== "string" || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Invalid card" }, { status: 400 });
  }
  await createCard(columnId, { id, title, description });
  return NextResponse.json({ ok: true });
}
