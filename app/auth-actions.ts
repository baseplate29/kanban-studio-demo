"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, validateSignup, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";

export async function signup(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const username = formData.get("username")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const error = validateSignup(username, password);
  if (error) return error;

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (existing) return "Username is already taken";

  const [user] = await db
    .insert(users)
    .values({ username, passwordHash: await hashPassword(password) })
    .returning();
  await createSession({ userId: user.id, username: user.username });
  revalidatePath("/");
  return null;
}

export async function login(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  const username = formData.get("username")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return "Invalid username or password";
  }
  await createSession({ userId: user.id, username: user.username });
  revalidatePath("/");
  return null;
}

export async function logout() {
  await destroySession();
  revalidatePath("/");
}
