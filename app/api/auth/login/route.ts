import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not configured on the server." },
      { status: 500 },
    );
  }
  let password = "";
  try {
    ({ password } = await req.json());
  } catch {
    /* ignore malformed body */
  }
  if (String(password) !== pw) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(pw), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
