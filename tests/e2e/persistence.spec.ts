import { Browser, expect, Page, test } from "@playwright/test";

const password = "password123";

async function signupAndEnter(page: Page) {
  const username = `p${Date.now()}${Math.floor(Math.random() * 10000)}`;
  await page.goto("/");
  await page.getByText("Need an account? Sign up").click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("+ Add card").first()).toBeVisible();
}

async function createCard(page: Page, column: string, title: string) {
  const region = page.getByRole("region", { name: column });
  await region.getByText("+ Add card").click();
  await region.getByLabel("New card title").fill(title);
  await region.getByLabel("New card title").press("Enter");
  await expect(region.getByText(title)).toBeVisible();
}

test("board changes survive a page reload", async ({ page }) => {
  await signupAndEnter(page);
  const title = `Persist ${Date.now()}`;
  await createCard(page, "To Do", title);

  const done = page.getByRole("region", { name: "Done" });
  const moveLanded = page.waitForResponse(
    (res) => res.url().includes("/api/cards/") && res.status() === 200,
  );
  await page.getByRole("article", { name: title }).dragTo(done);
  await expect(done.getByText(title)).toBeVisible();

  await moveLanded;
  await page.reload();
  await expect(
    page.getByRole("region", { name: "Done" }).getByText(title),
  ).toBeVisible();
});

test("another user's card appears via polling", async ({
  page,
  browser,
}: {
  page: Page;
  browser: Browser;
}) => {
  await signupAndEnter(page);

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await signupAndEnter(pageB);

  const title = `Polled ${Date.now()}`;
  await createCard(page, "To Do", title);

  await expect(
    pageB.getByRole("region", { name: "To Do" }).getByText(title),
  ).toBeVisible({ timeout: 10_000 });
  await contextB.close();
});
