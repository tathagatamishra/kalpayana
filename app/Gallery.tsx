"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { Category, Item } from "@/lib/types";
import Masonry from "./gallery/Masonry";
import Dropdown from "./gallery/Dropdown";
import ImageModal from "./gallery/ImageModal";

type Props = {
  initialItems: Item[];
  initialTotal: number;
  pageSize: number;
  categories: Category[];
};

export default function Gallery({
  initialItems,
  initialTotal,
  pageSize,
  categories: initialCategories,
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [total, setTotal] = useState(initialTotal);
  const [category, setCategory] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "az">("new");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(-1);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);
  const mounted = useRef(false);

  const hasMore = items.length < total;

  const fetchPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      const mine = ++reqId.current;
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(pageSize),
          sort,
        });
        if (category !== "all") params.set("category", category);
        if (q.trim()) params.set("q", q.trim());
        const res = await fetch(`/api/items?${params.toString()}`);
        const data = await res.json();
        if (mine !== reqId.current) return;
        setTotal(data.total || 0);
        setPage(nextPage);
        setItems((prev) => {
          if (replace) return data.items as Item[];
          const seen = new Set(prev.map((p) => p.id));
          return [
            ...prev,
            ...(data.items as Item[]).filter((x) => !seen.has(x.id)),
          ];
        });
      } catch (e) {
        if (mine === reqId.current) console.error(e);
      } finally {
        if (mine === reqId.current) setLoading(false);
      }
    },
    [category, q, sort, pageSize],
  );

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchPage(page + 1, false);
  }, [hasMore, loading, page, fetchPage]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    const t = setTimeout(() => fetchPage(1, true), 250);
    return () => clearTimeout(t);
  }, [category, q, sort, fetchPage]);

  // fallback: server render couldn't reach the DB → load categories on the client
  useEffect(() => {
    if (initialCategories.length > 0) return;
    const t = setTimeout(() => {
      fetch("/api/categories")
        .then((r) => r.json())
        .then((d) => Array.isArray(d.categories) && setCategories(d.categories))
        .catch(() => {});
    }, 0);
    return () => clearTimeout(t);
  }, [initialCategories.length]);

  // infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "1200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  // dialog open/close + scroll lock
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open >= 0 && !dlg.open) dlg.showModal();
    if (open < 0 && dlg.open) dlg.close();
    document.documentElement.style.overflow = open >= 0 ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // category label peeks in while scrolling (any screen), then auto-hides ~1s later
  useEffect(() => {
    let t: number;
    const onScroll = () => {
      const el = gridWrapRef.current;
      if (!el) return;
      el.classList.add("badges-on");
      clearTimeout(t);
      t = window.setTimeout(() => el.classList.remove("badges-on"), 1000);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  const chips = useMemo(
    () => [
      { name: "all", label: "All", count: total },
      ...categories.map((c) => ({
        name: c.name,
        label: c.name,
        count: c.count,
      })),
    ],
    [categories, total],
  );

  const onSearch = (e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value);

  return (
    <div className="mx-auto max-w-[1500px] px-3 pb-40 sm:px-4 sm:pb-44">
      <p className="px-1 pt-2 text-xs text-zinc-500">
        {total} image{total === 1 ? "" : "s"}
        {category !== "all" ? ` in ${category}` : ""}
        {q.trim() ? ` matching “${q.trim()}”` : ""}
      </p>

      <div ref={gridWrapRef} className="mt-3">
        {items.length === 0 && !loading ? (
          <p className="py-20 text-center text-zinc-500">Nothing here yet.</p>
        ) : (
          <Masonry items={items} onOpen={setOpen} />
        )}
      </div>

      <div ref={sentinelRef} className="h-px" />
      {loading && (
        <p className="py-6 text-center text-sm text-zinc-500">Loading…</p>
      )}

      {/* bottom controls */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="footer-blur-wrap" aria-hidden="true">
          <div className="footer-blur-panel is-1" />
          <div className="footer-blur-panel is-2" />
          <div className="footer-blur-panel is-3" />
          <div className="footer-blur-panel is-4" />
          <div className="footer-blur-panel is-5" />
          <div className="footer-blur-panel is-6" />
        </div>
        <div className="relative z-[1] mx-auto max-w-[1500px] px-3 pb-3 pt-2 sm:px-4">
          <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {chips.map((c) => (
              <button
                key={c.name}
                onClick={() => setCategory(c.name)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.8rem] transition backdrop-blur-xs ${
                  category === c.name
                    ? "border-sky-400 bg-sky-400/80 font-semibold text-[#04121f]"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {c.label}
                {typeof c.count === "number" && (
                  <span className="ml-1 opacity-60">{c.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search titles, tags, descriptions…"
              value={q}
              onChange={onSearch}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-900"
            />
            <Dropdown
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              direction="up"
              ariaLabel="Sort order"
              buttonClassName="bg-zinc-900/90"
              options={[
                { value: "new", label: "Newest" },
                { value: "old", label: "Oldest" },
                { value: "az", label: "Title A–Z" },
              ]}
            />
          </div>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(-1)}
        className="m-0 h-full max-h-none w-full max-w-none"
      >
        {open >= 0 && (
          <ImageModal
            items={items}
            initialIndex={open}
            onClose={() => setOpen(-1)}
            hasMore={hasMore}
            loadMore={loadMore}
          />
        )}
      </dialog>
    </div>
  );
}
