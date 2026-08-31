import { NextResponse } from "next/server";
import { getBoard } from "@/lib/board-store";
import { getSession } from "@/lib/session";

export async function GET() {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getBoard());
}
