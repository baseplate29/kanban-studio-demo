import { expect, Page, test } from "@playwright/test";

async function signupAndEnter(page: Page) {
  await page.goto("/");
  await page.getByText("Need an account? Sign up").click();
  await page
    .getByLabel("Username")
    .fill(`board${Date.now()}${Math.floor(Math.random() * 1000)}`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("+ Add card").first()).toBeVisible();
}

const dragTitle = `Drag ${Date.now()}`;

test("drag and drop moves a card between columns", async ({ page }) => {
  await signupAndEnter(page);

  const todo = page.getByRole("region", { name: "To Do" });
  await todo.getByText("+ Add card").click();
  await todo.getByLabel("New card title").fill(dragTitle);
  await todo.getByLabel("New card title").press("Enter");
  await expect(todo.getByText(dragTitle)).toBeVisible();

  const card = page.getByRole("article", { name: dragTitle });
  const done = page.getByRole("region", { name: "Done" });
  await card.dragTo(done);

  await expect(done.getByText(dragTitle)).toBeVisible();
  await expect(todo.getByText(dragTitle)).not.toBeVisible();
});
