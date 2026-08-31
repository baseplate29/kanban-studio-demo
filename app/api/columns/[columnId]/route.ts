import { NextResponse } from "next/server";
import { renameColumn } from "@/lib/board-store";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ columnId: string }> },
) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { columnId } = await params;
  const { name } = await request.json();
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  await renameColumn(columnId, name);
  return NextResponse.json({ ok: true });
}
