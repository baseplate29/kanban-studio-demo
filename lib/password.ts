import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function validateSignup(username: string, password: string) {
  if (username.length < 3) return "Username must be at least 3 characters";
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
}
