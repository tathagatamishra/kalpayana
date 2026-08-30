"use client";

import { useState, type FormEvent } from "react";
import type { Category } from "@/lib/types";
import ConfirmModal from "./ConfirmModal";

const inputCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-900";
const btnSm =
  "rounded-md border border-zinc-700 px-2.5 py-1 text-xs hover:border-zinc-500";

export default function Categories({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange?: () => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "err" | "ok"; text: string } | null>(
    null,
  );
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [confirmCat, setConfirmCat] = useState<Category | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed.");
      setMsg({
        type: "ok",
        text: data.existed ? "Category already existed." : "Category created.",
      });
      setName("");
      setDesc("");
      onChange?.();
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  function startEdit(c: Category) {
    setMsg(null);
    setEditId(c.id);
    setEditName(c.name);
    setEditDesc(c.description || "");
  }

  async function saveEdit(cat: Category) {
    const nm = editName.trim();
    if (!nm) {
      setMsg({ type: "err", text: "Name is required." });
      return;
    }
    const dsc = editDesc.trim();
    if (nm === cat.name && dsc === (cat.description || "")) {
      setEditId(null);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: nm, description: dsc }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed.");
      setMsg({
        type: "ok",
        text: `Saved${data.migrated ? ` — ${data.migrated} item(s) moved` : ""}.`,
      });
      setEditId(null);
      onChange?.();
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove(cat: Category) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed.");
      setMsg({ type: "ok", text: `Category “${cat.name}” deleted.` });
      onChange?.();
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Failed.",
      });
    } finally {
      setBusy(false);
      setConfirmCat(null);
    }
  }

  return (
    <>
      <form
        onSubmit={add}
        className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">New category name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Biology"
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-400">Description</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="optional"
              className={inputCls}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2.5">
          <button
            disabled={busy}
            className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-[#04121f] hover:bg-sky-300 disabled:opacity-50"
          >
            Create category
          </button>
          {msg && (
            <span
              className={`text-sm ${msg.type === "err" ? "text-red-400" : "text-emerald-400"}`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-2">
        {categories.length === 0 && (
          <p className="text-sm text-zinc-500">
            No categories yet — create one above.
          </p>
        )}
        {categories.map((c) => {
          const n = c.count ?? 0;
          const editing = editId === c.id;
          return (
            <div
              key={c.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
            >
              {editing ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Name</label>
                    <input
                      type="text"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditId(null);
                      }}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Description</label>
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(c);
                        if (e.key === "Escape") setEditId(null);
                      }}
                      placeholder="optional"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => saveEdit(c)}
                      disabled={busy}
                      className="rounded-md bg-sky-400 px-2.5 py-1 text-xs font-semibold text-[#04121f] disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button onClick={() => setEditId(null)} className={btnSm}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm">{c.name}</div>
                      <div className="text-xs text-zinc-500">
                        {n} image{n === 1 ? "" : "s"}
                        {c.description ? ` · ${c.description}` : ""}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => startEdit(c)} className={btnSm}>
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmCat(c)}
                        disabled={busy || n > 0}
                        title={
                          n > 0
                            ? "Empty this category before deleting it"
                            : undefined
                        }
                        className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-400 hover:border-red-500 disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-600 disabled:hover:border-zinc-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {n > 0 && (
                    <p className="mt-1.5 text-[0.7rem] text-zinc-600">
                      Move or remove its {n} image{n === 1 ? "" : "s"} before this
                      category can be deleted.
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmModal
        open={!!confirmCat}
        message={
          <>
            Delete the category{" "}
            <b className="text-zinc-200">“{confirmCat?.name}”</b>? This can’t be
            undone.
          </>
        }
        busy={busy}
        onConfirm={() => confirmCat && remove(confirmCat)}
        onCancel={() => setConfirmCat(null)}
      />
    </>
  );
}
