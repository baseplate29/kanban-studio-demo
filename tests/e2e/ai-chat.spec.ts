import { expect, Page, test } from "@playwright/test";

// A live model call occasionally returns a junk reply; retry the whole flow.
test.describe.configure({ retries: 2 });

async function signupAndEnter(page: Page) {
  await page.goto("/");
  await page.getByText("Need an account? Sign up").click();
  await page
    .getByLabel("Username")
    .fill(`ai${Date.now()}${Math.floor(Math.random() * 1000)}`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("+ Add card").first()).toBeVisible();
}

test("AI chat creates a card that appears without a reload", async ({
  page,
}) => {
  await signupAndEnter(page);

  const title = `AiCard${Date.now()}`;
  await page
    .getByLabel("Chat message")
    .fill(`Add a card titled "${title}" to the To Do column.`);
  await page.getByRole("button", { name: "Send" }).click();

  await expect(
    page.getByRole("region", { name: "To Do" }).getByText(title),
  ).toBeVisible({ timeout: 60_000 });
});
