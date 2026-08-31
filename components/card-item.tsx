"use client";

import { useState } from "react";
import { Card, deleteCard, updateCard } from "@/lib/board";
import { apiDeleteCard, apiUpdateCard } from "@/lib/board-api";
import { Button } from "@/components/ui/button";
import { Card as CardBox, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Mutate } from "./board-view";

export function CardItem({ card, mutate }: { card: Card; mutate: Mutate }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <CardBox className="py-3">
        <CardContent className="px-3">
          <form
            className="flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const title = data.get("title")?.toString().trim();
              const description = data.get("description")?.toString() ?? "";
              if (title) {
                mutate(
                  (b) => updateCard(b, card.id, { title, description }),
                  () => apiUpdateCard(card.id, { title, description }),
                );
              }
              setEditing(false);
            }}
          >
            <Input
              name="title"
              aria-label="Card title"
              defaultValue={card.title}
              autoFocus
            />
            <Textarea
              name="description"
              aria-label="Card description"
              defaultValue={card.description}
              rows={2}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="ml-auto"
                onClick={() =>
                  mutate(
                    (b) => deleteCard(b, card.id),
                    () => apiDeleteCard(card.id),
                  )
                }
              >
                Delete
              </Button>
            </div>
          </form>
        </CardContent>
      </CardBox>
    );
  }

  return (
    <CardBox
      draggable
      role="article"
      aria-label={card.title}
      className="cursor-grab gap-1 py-3 transition-shadow hover:shadow-md hover:ring-1 hover:ring-brand-blue"
      onDragStart={(e) => e.dataTransfer.setData("text/card-id", card.id)}
      onClick={() => setEditing(true)}
    >
      <CardContent className="px-3">
        <div className="text-sm font-medium">{card.title}</div>
        {card.description && (
          <div className="mt-1 text-xs text-gray-text">{card.description}</div>
        )}
      </CardContent>
    </CardBox>
  );
}
