"use client";

import { Board } from "@/lib/board";
import { BoardView } from "./board-view";

// The AI chat sidebar gets added here during the live demo
// (see docs/DEMO.md).
export function Workspace({ initialBoard }: { initialBoard: Board }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-stretch">
      <BoardView initialBoard={initialBoard} />
    </div>
  );
}
