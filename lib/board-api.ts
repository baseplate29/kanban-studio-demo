import type { Board, Card } from "./board";

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function apiFetchBoard(): Promise<Board | null> {
  const res = await fetch("/api/board");
  return res.ok ? res.json() : null;
}

export function apiRenameColumn(columnId: string, name: string) {
  return fetch(`/api/columns/${columnId}`, json("PATCH", { name }));
}

export function apiCreateCard(columnId: string, card: Card) {
  return fetch("/api/cards", json("POST", { ...card, columnId }));
}

export function apiUpdateCard(
  cardId: string,
  patch: { title: string; description: string },
) {
  return fetch(`/api/cards/${cardId}`, json("PATCH", patch));
}

export function apiDeleteCard(cardId: string) {
  return fetch(`/api/cards/${cardId}`, { method: "DELETE" });
}

export function apiMoveCard(cardId: string, toColumnId: string, toIndex: number) {
  return fetch(`/api/cards/${cardId}`, json("PATCH", { toColumnId, toIndex }));
}
