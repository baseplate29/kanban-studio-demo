import { beforeEach, expect, test, vi } from "vitest";
import {
  apiCreateCard,
  apiDeleteCard,
  apiFetchBoard,
  apiMoveCard,
  apiRenameColumn,
  apiUpdateCard,
} from "./board-api";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ columns: [] }) });
  vi.stubGlobal("fetch", fetchMock);
});

test("apiFetchBoard returns board JSON, or null on error", async () => {
  expect(await apiFetchBoard()).toEqual({ columns: [] });
  fetchMock.mockResolvedValue({ ok: false });
  expect(await apiFetchBoard()).toBeNull();
});

test("apiRenameColumn PATCHes the column", async () => {
  await apiRenameColumn("col1", "Backlog");
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/columns/col1");
  expect(init.method).toBe("PATCH");
  expect(JSON.parse(init.body)).toEqual({ name: "Backlog" });
});

test("apiCreateCard POSTs the card with its column", async () => {
  await apiCreateCard("col1", { id: "c1", title: "T", description: "" });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/cards");
  expect(init.method).toBe("POST");
  expect(JSON.parse(init.body)).toEqual({
    id: "c1",
    title: "T",
    description: "",
    columnId: "col1",
  });
});

test("apiUpdateCard PATCHes title and description", async () => {
  await apiUpdateCard("c1", { title: "New", description: "d" });
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/cards/c1");
  expect(JSON.parse(init.body)).toEqual({ title: "New", description: "d" });
});

test("apiDeleteCard DELETEs the card", async () => {
  await apiDeleteCard("c1");
  expect(fetchMock.mock.calls[0]).toEqual([
    "/api/cards/c1",
    { method: "DELETE" },
  ]);
});

test("apiMoveCard PATCHes the target column and index", async () => {
  await apiMoveCard("c1", "col2", 3);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/cards/c1");
  expect(JSON.parse(init.body)).toEqual({ toColumnId: "col2", toIndex: 3 });
});
