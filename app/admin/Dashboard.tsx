"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  LuArrowLeft,
  LuArrowRight,
  LuArrowUpRight,
  LuLogOut,
  LuPlus,
} from "react-icons/lu";
import ItemForm from "./ItemForm";
import Categories from "./Categories";
import ConfirmModal from "./ConfirmModal";
import Dropdown from "../gallery/Dropdown";
import type { Category, Item } from "@/lib/types";

const LIMIT = 20;
const btnSm =
  "rounded-md border border-zinc-700 px-2.5 py-1 text-xs hover:border-zinc-500";

export default function Dashboard() {
  const [tab, setTab] = useState<"content" | "categories">("content");
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [confirmItem, setConfirmItem] = useState<Item | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        sort: "new",
      });
      if (q.trim()) params.set("q", q.trim());
      if (cat !== "all") params.set("category", cat);
      const res = await fetch(`/api/items?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, q, cat]);

  useEffect(() => {
    const t = setTimeout(loadCategories, 0);
    return () => clearTimeout(t);
  }, [loadCategories]);

  useEffect(() => {
    const t = setTimeout(loadItems, 200);
    return () => clearTimeout(t);
  }, [loadItems]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }

  async function del(it: Item) {
    setDelBusy(true);
    try {
      const res = await fetch(`/api/items/${it.id}`, { method: "DELETE" });
      if (res.ok) {
        loadItems();
        loadCategories();
      } else {
        alert("Delete failed.");
      }
    } finally {
      setDelBusy(false);
      setConfirmItem(null);
    }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-20 pt-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">
          ADMIN
        </h1>
        <div className="ml-auto flex gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className={btnSm + " inline-flex items-center gap-1"}
          >
            view gallery <LuArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={logout}
            className={btnSm + " inline-flex items-center gap-1"}
          >
            <LuLogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-1 border-b border-zinc-800">
        {(["content", "categories"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3.5 py-2.5 text-sm ${tab === t
                ? "border-sky-400 text-zinc-100"
                : "border-transparent text-zinc-400"
              }`}
          >
            {t === "content"
              ? "Content"
              : `Categories (${categories.length})`}
          </button>
        ))}
      </div>

      {tab === "categories" && (
        <Categories
          categories={categories}
          onChange={() => {
            loadCategories();
            loadItems();
          }}
        />
      )}

      {tab === "content" && (
        <>
          {editItem ? (
            <ItemForm
              categories={categories}
              initial={editItem}
              onCategoryCreated={loadCategories}
              onSaved={() => {
                setEditItem(null);
                loadItems();
                loadCategories();
              }}
              onCancel={() => setEditItem(null)}
            />
          ) : adding ? (
            <ItemForm
              categories={categories}
              onCategoryCreated={loadCategories}
              onSaved={() => {
                loadItems();
                loadCategories();
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              disabled={categories.length === 0}
              className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-[#04121f] hover:bg-sky-300 disabled:opacity-50"
            >
              <LuPlus className="h-4 w-4" /> Add image
            </button>
          )}
          {categories.length === 0 && !adding && (
            <p className="mb-4 text-sm text-zinc-500">
              Create a category first (Categories tab).
            </p>
          )}

          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search content…"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="min-w-0 flex-1 basis-48 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <Dropdown
              value={cat}
              onChange={(v) => {
                setPage(1);
                setCat(v);
              }}
              direction="down"
              buttonClassName="rounded-lg bg-zinc-950 py-2"
              ariaLabel="Filter by category"
              options={[
                { value: "all", label: "All categories" },
                ...categories.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500">No content found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-2"
                >
                  <img
                    src={it.thumbUrl || it.imageUrl}
                    alt=""
                    className="h-12 w-16 rounded-md bg-zinc-950 object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{it.title}</div>
                    <div className="truncate text-xs text-zinc-500">
                      {it.category || "uncategorised"}
                      {it.captureDate ? ` · ${it.captureDate}` : ""}
                      {it.takenBy ? ` · ${it.takenBy}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setAdding(false);
                        setEditItem(it);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={btnSm}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmItem(it)}
                      className="rounded-md border border-red-500/40 px-2.5 py-1 text-xs text-red-400 hover:border-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-zinc-400">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={btnSm + " inline-flex items-center gap-1 disabled:opacity-40"}
              >
                <LuArrowLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span>
                Page {page} / {pages} · {total} items
              </span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className={btnSm + " inline-flex items-center gap-1 disabled:opacity-40"}
              >
                Next <LuArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!confirmItem}
        message={
          <>
            Delete{" "}
            <b className="text-zinc-200">“{confirmItem?.title}”</b>? This can’t be
            undone.
          </>
        }
        busy={delBusy}
        onConfirm={() => confirmItem && del(confirmItem)}
        onCancel={() => setConfirmItem(null)}
      />
    </div>
  );
}
