export type Card = {
  id: string;
  title: string;
  description: string;
};

export type Column = {
  id: string;
  name: string;
  cards: Card[];
};

export type Board = {
  columns: Column[];
};

export function renameColumn(board: Board, columnId: string, name: string): Board {
  return {
    columns: board.columns.map((col) =>
      col.id === columnId ? { ...col, name } : col,
    ),
  };
}

export function createCard(board: Board, columnId: string, card: Card): Board {
  return {
    columns: board.columns.map((col) =>
      col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
    ),
  };
}

export function updateCard(
  board: Board,
  cardId: string,
  patch: { title?: string; description?: string },
): Board {
  return {
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.map((card) =>
        card.id === cardId ? { ...card, ...patch } : card,
      ),
    })),
  };
}

export function deleteCard(board: Board, cardId: string): Board {
  return {
    columns: board.columns.map((col) => ({
      ...col,
      cards: col.cards.filter((card) => card.id !== cardId),
    })),
  };
}

export function moveCard(
  board: Board,
  cardId: string,
  toColumnId: string,
  toIndex: number,
): Board {
  const card = board.columns
    .flatMap((col) => col.cards)
    .find((c) => c.id === cardId);
  if (!card) return board;
  return {
    columns: board.columns.map((col) => {
      const cards = col.cards.filter((c) => c.id !== cardId);
      if (col.id === toColumnId) {
        cards.splice(toIndex, 0, card);
      }
      return { ...col, cards };
    }),
  };
}
