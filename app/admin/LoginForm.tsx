"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

export default function LoginForm({ configured }: { configured: boolean }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Login failed.");
    } catch {
      setErr("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto mt-[12vh] w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-7">
      <h1 className="text-lg font-bold">
        kalpa<span className="text-sky-400">yana</span> admin
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        {configured
          ? "Enter the admin password."
          : "ADMIN_PASSWORD is not set on the server — add it to your environment variables."}
      </p>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          autoFocus
          disabled={!configured}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-900 disabled:opacity-50"
        />
        <button
          disabled={busy || !configured}
          className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-[#04121f] hover:bg-sky-300 disabled:opacity-50"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
        {err && <div className="text-sm text-red-400">{err}</div>}
      </form>
      <p className="mt-4 text-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sky-400 hover:underline"
        >
          <LuArrowLeft className="h-3.5 w-3.5" /> back to gallery
        </Link>
      </p>
    </div>
  );
}
