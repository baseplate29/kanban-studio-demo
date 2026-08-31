import { expect, Page, test } from "@playwright/test";

const password = "password123";

function uniqueUser() {
  return `user${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function signup(page: Page, username: string) {
  await page.goto("/");
  await page.getByText("Need an account? Sign up").click();
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
}

test("board is hidden when signed out", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await expect(page.getByText("+ Add card")).not.toBeVisible();
});

test("signup shows the board, logout returns to login", async ({ page }) => {
  const username = uniqueUser();
  await signup(page, username);
  await expect(page.getByText("+ Add card").first()).toBeVisible();

  await expect(page.getByText(username)).toBeVisible();
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
  await expect(page.getByText("+ Add card")).not.toBeVisible();
});

test("login works after signup", async ({ page }) => {
  const username = uniqueUser();
  await signup(page, username);
  await expect(page.getByText("+ Add card").first()).toBeVisible();
  await logout(page);

  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("+ Add card").first()).toBeVisible();
});

test("failed login shows an error", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("nobody-here");
  await page.getByLabel("Password").fill("wrongpassword");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid username or password")).toBeVisible();
});

test("duplicate signup is rejected", async ({ page }) => {
  const username = uniqueUser();
  await signup(page, username);
  await expect(page.getByText("+ Add card").first()).toBeVisible();
  await logout(page);

  await signup(page, username);
  await expect(page.getByText("Username is already taken")).toBeVisible();
});
