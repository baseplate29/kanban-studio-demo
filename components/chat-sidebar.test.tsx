import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { ChatSidebar } from "./chat-sidebar";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

test("sends a message and shows the AI reply", async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ reply: "Card added.", applied: true }),
  });
  const onBoardChanged = vi.fn();
  const user = userEvent.setup();
  render(<ChatSidebar onBoardChanged={onBoardChanged} />);

  await user.type(screen.getByLabelText("Chat message"), "Add a card{Enter}");
  expect(screen.getByText("Add a card")).toBeInTheDocument();
  expect(await screen.findByText("Card added.")).toBeInTheDocument();
  expect(onBoardChanged).toHaveBeenCalledOnce();

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/chat");
  expect(JSON.parse(init.body)).toEqual({
    messages: [{ role: "user", content: "Add a card" }],
  });
});

test("shows a loading state while waiting", async () => {
  let resolve!: (v: unknown) => void;
  fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
  const user = userEvent.setup();
  render(<ChatSidebar onBoardChanged={() => {}} />);

  await user.type(screen.getByLabelText("Chat message"), "Hello{Enter}");
  expect(screen.getByText("Thinking...")).toBeInTheDocument();
  resolve({ ok: true, json: async () => ({ reply: "Hi", applied: false }) });
  expect(await screen.findByText("Hi")).toBeInTheDocument();
  expect(screen.queryByText("Thinking...")).not.toBeInTheDocument();
});

test("does not report a board change when nothing was applied", async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ reply: "Just chatting.", applied: false }),
  });
  const onBoardChanged = vi.fn();
  const user = userEvent.setup();
  render(<ChatSidebar onBoardChanged={onBoardChanged} />);

  await user.type(screen.getByLabelText("Chat message"), "Hi{Enter}");
  expect(await screen.findByText("Just chatting.")).toBeInTheDocument();
  expect(onBoardChanged).not.toHaveBeenCalled();
});

test("shows an error message when the request fails", async () => {
  fetchMock.mockResolvedValue({ ok: false });
  const user = userEvent.setup();
  render(<ChatSidebar onBoardChanged={() => {}} />);

  await user.type(screen.getByLabelText("Chat message"), "Hi{Enter}");
  expect(
    await screen.findByText("Sorry, something went wrong."),
  ).toBeInTheDocument();
});
