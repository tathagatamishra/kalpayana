import crypto from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "kalp_session";

export function sessionToken(password: string): string {
  return crypto
    .createHash("sha256")
    .update(String(password) + "::kalpayana::v1")
    .digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const jar = await cookies();
  const val = jar.get(SESSION_COOKIE)?.value;
  return !!val && val === sessionToken(pw);
}

export class UnauthorizedError extends Error {
  status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new UnauthorizedError();
}
