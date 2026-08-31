"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Board,
  Card,
  Column,
  createCard,
  moveCard,
  renameColumn,
} from "@/lib/board";
import {
  apiCreateCard,
  apiFetchBoard,
  apiMoveCard,
  apiRenameColumn,
} from "@/lib/board-api";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CardItem } from "./card-item";

export type Mutate = (
  op: (board: Board) => Board,
  request: () => Promise<unknown>,
) => void;

const POLL_MS = 3000;

export function BoardView({
  initialBoard,
  refreshSignal = 0,
}: {
  initialBoard: Board;
  refreshSignal?: number;
}) {
  const [board, setBoard] = useState(initialBoard);
  const pending = useRef(0);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const rootRef = useRef<HTMLDivElement>(null);

  // Requests run one at a time, in order, so e.g. a move cannot reach the
  // server before the creation of the card being moved.
  const mutate: Mutate = useCallback((op, request) => {
    setBoard(op);
    pending.current++;
    queue.current = queue.current
      .then(request)
      .catch(() => {})
      .finally(() => pending.current--);
  }, []);

  useEffect(() => {
    const id = setInterval(async () => {
      // Skip refresh while a mutation is in flight or the user is typing,
      // so the poll cannot revert an edit that has not reached the server yet.
      if (pending.current > 0) return;
      const active = document.activeElement;
      if (active && rootRef.current?.contains(active)) return;
      const fresh = await apiFetchBoard();
      if (fresh && pending.current === 0) setBoard(fresh);
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Immediate refresh when the AI chat applies a board change.
  useEffect(() => {
    if (refreshSignal === 0) return;
    (async () => {
      const fresh = await apiFetchBoard();
      if (fresh && pending.current === 0) setBoard(fresh);
    })();
  }, [refreshSignal]);

  return (
    <div
      ref={rootRef}
      className="flex min-w-0 flex-1 items-start gap-4 overflow-auto p-4"
    >
      {board.columns.map((column) => (
        <ColumnView key={column.id} column={column} mutate={mutate} />
      ))}
    </div>
  );
}

function ColumnView({ column, mutate }: { column: Column; mutate: Mutate }) {
  const [adding, setAdding] = useState(false);

  function handleDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    e.stopPropagation();
    const cardId = e.dataTransfer.getData("text/card-id");
    if (cardId) {
      mutate(
        (b) => moveCard(b, cardId, column.id, toIndex),
        () => apiMoveCard(cardId, column.id, toIndex),
      );
    }
  }

  return (
    <section
      aria-label={column.name}
      className="flex min-w-52 max-w-80 flex-1 flex-col gap-2 rounded-xl border border-border border-t-2 border-t-brand-accent bg-muted/50 p-3"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => handleDrop(e, column.cards.length)}
    >
      <div className="flex items-center gap-2">
        <input
          aria-label="Column name"
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 font-semibold text-navy outline-none focus:bg-background focus:ring-1 focus:ring-brand-blue"
          value={column.name}
          onChange={(e) =>
            mutate(
              (b) => renameColumn(b, column.id, e.target.value),
              () => apiRenameColumn(column.id, e.target.value),
            )
          }
        />
        <Badge variant="secondary">{column.cards.length}</Badge>
      </div>
      <Separator />
      {column.cards.length === 0 && !adding && (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border py-6 text-gray-text">
          <Inbox className="size-5" />
          <span className="text-xs">No cards yet</span>
        </div>
      )}
      {column.cards.map((card, index) => (
        <div key={card.id} onDrop={(e) => handleDrop(e, index)}>
          <CardItem card={card} mutate={mutate} />
        </div>
      ))}
      {adding ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const title = new FormData(e.currentTarget)
              .get("title")
              ?.toString()
              .trim();
            if (title) {
              const card: Card = {
                id: crypto.randomUUID(),
                title,
                description: "",
              };
              mutate(
                (b) => createCard(b, column.id, card),
                () => apiCreateCard(column.id, card),
              );
            }
            setAdding(false);
          }}
        >
          <Input
            name="title"
            aria-label="New card title"
            autoFocus
            className="bg-background"
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
          />
        </form>
      ) : (
        <Button
          variant="ghost"
          className="justify-start text-gray-text"
          onClick={() => setAdding(true)}
        >
          + Add card
        </Button>
      )}
    </section>
  );
}
