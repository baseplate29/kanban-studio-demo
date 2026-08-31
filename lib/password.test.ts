import { expect, test } from "vitest";
import { hashPassword, validateSignup, verifyPassword } from "./password";

test("hashes and verifies a password", async () => {
  const hash = await hashPassword("correct horse");
  expect(hash).not.toBe("correct horse");
  expect(await verifyPassword("correct horse", hash)).toBe(true);
  expect(await verifyPassword("wrong", hash)).toBe(false);
});

test("validateSignup rejects short username", () => {
  expect(validateSignup("ab", "longenough")).toMatch(/Username/);
});

test("validateSignup rejects short password", () => {
  expect(validateSignup("alice", "short")).toMatch(/Password/);
});

test("validateSignup accepts valid input", () => {
  expect(validateSignup("alice", "longenough")).toBeNull();
});
