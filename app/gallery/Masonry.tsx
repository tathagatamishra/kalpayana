"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/lib/types";

type Props = {
  items: Item[];
  onOpen: (index: number) => void;
};

/**
 * Row-wise ("Pinterest") masonry: each item is placed into whichever column is
 * currently shortest, so the visual fill order runs left→right, top→bottom —
 * unlike CSS `columns`, which fills each column top-to-bottom before the next.
 */
export default function Masonry({ items, onOpen }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [ratios, setRatios] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const reportRatio = useCallback((id: string, r: number) => {
    if (!Number.isFinite(r) || r <= 0) return;
    setRatios((prev) =>
      prev[id] && Math.abs(prev[id] - r) < 0.005 ? prev : { ...prev, [id]: r },
    );
  }, []);

  const { placed, height, colWidth } = useMemo(() => {
    if (width <= 0)
      return { placed: [] as { left: number; top: number; h: number }[], height: 0, colWidth: 0 };
    const gap = width < 640 ? 10 : 14;
    const minCol = width < 640 ? 150 : width < 1024 ? 210 : 250;
    const cols = Math.max(1, Math.floor((width + gap) / (minCol + gap)));
    const cw = (width - gap * (cols - 1)) / cols;
    const colH = new Array(cols).fill(0);

    const placed = items.map((it) => {
      const r =
        ratios[it.id] ||
        (it.width && it.height ? it.width / it.height : 4 / 3);
      const h = cw / Math.max(0.4, Math.min(3, r));
      let c = 0;
      for (let k = 1; k < cols; k++) if (colH[k] < colH[c] - 0.5) c = k;
      const top = colH[c];
      const left = c * (cw + gap);
      colH[c] = top + h + gap;
      return { left, top, h };
    });

    const tallest = colH.length ? Math.max(...colH) : 0;
    return { placed, height: Math.max(0, tallest - gap), colWidth: cw };
  }, [items, ratios, width]);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {items.map((it, i) => {
        const p = placed[i];
        if (!p) return null;
        return (
          <div
            key={it.id}
            className="absolute left-0 top-0 transition-[transform] duration-200 ease-out"
            style={{
              transform: `translate3d(${p.left}px, ${p.top}px, 0)`,
              width: colWidth,
              height: p.h,
            }}
          >
            <Card item={it} onClick={() => onOpen(i)} onRatio={reportRatio} />
          </div>
        );
      })}
    </div>
  );
}

function Card({
  item,
  onClick,
  onRatio,
}: {
  item: Item;
  onClick: () => void;
  onRatio: (id: string, ratio: number) => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={item.title}
      className="group relative block h-full w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-left transition hover:border-sky-400"
    >
      <div
        className={`img-skeleton absolute inset-0 rounded-xl transition-opacity duration-300 ${
          loaded ? "opacity-0" : "opacity-100"
        }`}
      />
      <img
        src={item.thumbUrl || item.imageUrl}
        alt={item.title}
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          setLoaded(true);
          const el = e.currentTarget;
          if (el.naturalWidth && el.naturalHeight)
            onRatio(item.id, el.naturalWidth / el.naturalHeight);
        }}
        onError={() => setLoaded(true)}
        className={`img-fade absolute inset-0 h-full w-full object-cover ${
          loaded ? "is-loaded" : ""
        }`}
      />
      {item.category ? (
        <span className="card-badge absolute left-2 top-2 rounded-md border border-zinc-700 bg-black/70 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-zinc-300">
          {item.category}
        </span>
      ) : null}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2.5 pt-8 text-[0.8rem] leading-snug opacity-0 transition group-hover:opacity-100">
        {item.title}
      </span>
    </button>
  );
}
