"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  LuArrowLeftRight,
  LuArrowUpDown,
  LuArrowUpRight,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronUp,
  LuDownload,
  LuInfo,
  LuX,
} from "react-icons/lu";
import type { Item } from "@/lib/types";
import { downloadImage, fmtDate, hostOf, slugify } from "./util";

type Props = {
  items: Item[];
  initialIndex: number;
  onClose: () => void;
  hasMore: boolean;
  loadMore: () => void;
};

export default function ImageModal({
  items,
  initialIndex,
  onClose,
  hasMore,
  loadMore,
}: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [mode, setMode] = useState<"swipe" | "feed">("swipe");
  const [sheet, setSheet] = useState(false);
  const [chrome, setChrome] = useState(true);

  // Tap (not swipe / not a control) on the media area toggles the modal chrome.
  const tap = useRef<{ x: number; y: number; t: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    tap.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const s = tap.current;
    tap.current = null;
    if (!s) return;
    if (e.target instanceof Element && e.target.closest("button, a")) return;
    const moved = Math.hypot(e.clientX - s.x, e.clientY - s.y);
    if (moved < 10 && Date.now() - s.t < 400) setChrome((c) => !c);
  };

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(items.length - 1, i)),
    [items.length],
  );
  const set = useCallback((i: number) => setIndex(clamp(i)), [clamp]);

  useEffect(() => {
    if (index >= items.length - 3 && hasMore) loadMore();
  }, [index, items.length, hasMore, loadMore]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return sheet ? setSheet(false) : onClose();
      const fwd = mode === "swipe" ? "ArrowRight" : "ArrowDown";
      const back = mode === "swipe" ? "ArrowLeft" : "ArrowUp";
      if (e.key === fwd) setIndex((i) => clamp(i + 1));
      if (e.key === back) setIndex((i) => clamp(i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, sheet, clamp, onClose]);

  const cur = items[index];
  if (!cur) return null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#05070d]">
      <div
        className={`grid h-full grid-cols-1 transition-[grid-template-columns] duration-300 ease-out ${chrome
            ? "md:grid-cols-[minmax(0,1fr)_380px]"
            : "md:grid-cols-[minmax(0,1fr)_0px]"
          }`}
      >
        {/* media area */}
        <div
          className="relative min-w-0 overflow-hidden bg-[#04060b]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (tap.current = null)}
        >
          <SnapCarousel
            key={mode}
            axis={mode === "swipe" ? "x" : "y"}
            items={items}
            index={index}
            setIndex={set}
          />

          {/* progressive blur under the mobile bottom UI —
             layer order: image < this blur < caption / footer controls */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-44 transition-opacity duration-300 md:hidden ${chrome ? "opacity-100" : "opacity-0"
              }`}
          >
            <FooterBlur />
          </div>

          {/* desktop prev/next — bottom-right of the slide, on the footer's row.
             Left/right chevrons in swipe view, up/down in reel view.
             Scroll (wheel / trackpad) changes slides too, in both modes. */}
          <div
            className={`absolute bottom-0 right-0 z-40 hidden h-14 items-center gap-2 pr-3 transition-opacity duration-300 md:flex ${chrome ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
          >
            <button
              onClick={() => set(index - 1)}
              disabled={index === 0}
              aria-label="Previous"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/80 text-white transition-colors backdrop-blur-xs hover:bg-sky-400/80 hover:text-[#04121f] disabled:pointer-events-none disabled:opacity-40"
            >
              {mode === "swipe" ? (
                <LuChevronLeft className="h-5 w-5" />
              ) : (
                <LuChevronUp className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => set(index + 1)}
              disabled={index === items.length - 1}
              aria-label="Next"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/80 text-white transition-colors backdrop-blur-xs hover:bg-sky-400/80 hover:text-[#04121f] disabled:pointer-events-none disabled:opacity-40"
            >
              {mode === "swipe" ? (
                <LuChevronRight className="h-5 w-5" />
              ) : (
                <LuChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* caption overlay — mobile only, identical in both modes, updates with cur */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-14 pt-20 transition-opacity duration-300 md:hidden ${chrome ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="absolute inset-0" />
            <div className="relative z-[1] px-4 pb-3">
              {cur.category && (
                <p className="text-[0.65rem] uppercase tracking-wide text-sky-300">
                  {cur.category}
                </p>
              )}
              <h3 className="line-clamp-2 text-sm font-semibold text-white">
                {cur.title}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-300">
                {fmtDate(cur.captureDate)}
                {cur.takenBy ? ` · ${cur.takenBy}` : ""}
              </p>
              <div
                className={`mt-2 flex flex-wrap items-center gap-2 ${chrome ? "pointer-events-auto" : "pointer-events-none"
                  }`}
              >
                <button
                  onClick={() =>
                    downloadImage(
                      cur.fullImageUrl || cur.imageUrl,
                      `${slugify(cur.title)}.jpg`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/80 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-black hover:bg-white"
                >
                  <LuDownload className="h-3.5 w-3.5" /> Download
                </button>
                <button
                  onClick={() => setSheet(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/2 backdrop-blur-xs px-3 py-1 text-xs text-white hover:bg-white/10"
                >
                  <LuInfo className="h-3.5 w-3.5" /> Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* details panel — desktop, shared by both modes */}
        <aside
          className={`thin-scroll hidden min-w-0 overflow-y-auto border-zinc-800 bg-zinc-950 transition-[opacity,padding] duration-300 md:block ${chrome
              ? "border-l px-6 pb-20 pt-7 opacity-100"
              : "pointer-events-none px-0 opacity-0"
            }`}
        >
          <Details item={cur} />
        </aside>
      </div>

      {/* sticky footer — same progressive blur as the header */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 h-14 transition-opacity duration-300 ${chrome ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
      >
        <div className="relative z-[1] flex h-full items-center gap-2 px-3 bg-gradient-to-t from-black/55 via-black/15 to-transparent">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/60 backdrop-blur-xs px-3.5 py-1.5 text-sm text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
          >
            <LuX className="h-4 w-4" /> Close
          </button>
          <div className="flex-1" />
          <span className="hidden text-xs tabular-nums text-zinc-500 sm:inline">
            {index + 1} / {items.length}
          </span>
          <button
            onClick={() => setMode((m) => (m === "swipe" ? "feed" : "swipe"))}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold text-[#04121f] hover:bg-sky-300 
            
             border transition backdrop-blur-xs border-sky-400 bg-sky-400/80"
          >
            {mode === "swipe" ? (
              <>
                <LuArrowUpDown className="h-4 w-4" /> Reel view
              </>
            ) : (
              <>
                <LuArrowLeftRight className="h-4 w-4" /> Swipe view
              </>
            )}
          </button>
        </div>
      </div>

      {/* details bottom sheet — mobile, shared by both modes */}
      {sheet && (
        <BottomSheet onClose={() => setSheet(false)}>
          <Details item={cur} />
        </BottomSheet>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One scroll-snap carousel for both modes — vertical for "Reel",     *
 * horizontal for "Swipe". Native momentum scroll + snap either way.  *
 * ------------------------------------------------------------------ */

function SnapCarousel({
  items,
  index,
  setIndex,
  axis,
}: {
  items: Item[];
  index: number;
  setIndex: (i: number) => void;
  axis: "x" | "y";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const didInit = useRef(false);
  const scrolledTo = useRef(index);
  const horizontal = axis === "x";

  // land on the current image when this carousel mounts (open / mode switch).
  // The <dialog> may still be display:none for a frame, so retry until sized.
  useLayoutEffect(() => {
    if (didInit.current) return;
    const root = rootRef.current;
    if (!root) return;
    let raf = 0;
    const place = () => {
      const size = horizontal ? root.clientWidth : root.clientHeight;
      if (size === 0) {
        raf = requestAnimationFrame(place);
        return;
      }
      if (horizontal) root.scrollLeft = index * size;
      else root.scrollTop = index * size;
      scrolledTo.current = index;
      didInit.current = true;
    };
    place();
    return () => cancelAnimationFrame(raf);
  }, [index, horizontal]);

  // glide to `index` only when it changed from outside the scroll (arrows / keys)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || index === scrolledTo.current) return;
    scrolledTo.current = index;
    const size = horizontal ? root.clientWidth : root.clientHeight;
    root.scrollTo(
      horizontal
        ? { left: index * size, behavior: "smooth" }
        : { top: index * size, behavior: "smooth" },
    );
  }, [index, horizontal]);

  // wheel / trackpad = advance one slide with a smooth glide (one notch per slide).
  // Horizontal axis for swipe view, vertical for reel view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let lock = false;
    let accum = 0;
    let lockT = 0;
    const onWheel = (e: WheelEvent) => {
      const d =
        horizontal && Math.abs(e.deltaX) >= Math.abs(e.deltaY)
          ? e.deltaX
          : e.deltaY;
      if (!d) return;
      e.preventDefault(); // take over from native scroll so snap doesn't fight the glide
      if (lock) return;
      accum += d;
      if (Math.abs(accum) < 20) return;
      const dir = accum > 0 ? 1 : -1;
      accum = 0;
      lock = true;
      window.clearTimeout(lockT);
      lockT = window.setTimeout(() => {
        lock = false;
      }, 480);
      const next = Math.max(
        0,
        Math.min(items.length - 1, scrolledTo.current + dir),
      );
      if (next !== scrolledTo.current) setIndex(next);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      root.removeEventListener("wheel", onWheel);
      window.clearTimeout(lockT);
    };
  }, [horizontal, items.length, setIndex]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!didInit.current) return; // ignore scroll events before we've placed it
    const root = e.currentTarget;
    const i = Math.max(
      0,
      Math.min(
        items.length - 1,
        horizontal
          ? Math.round(root.scrollLeft / (root.clientWidth || 1))
          : Math.round(root.scrollTop / (root.clientHeight || 1)),
      ),
    );
    scrolledTo.current = i;
    setIndex(i);
  };

  return (
    <div
      ref={rootRef}
      onScroll={onScroll}
      className={`no-scrollbar h-full overscroll-contain ${horizontal
          ? "flex snap-x snap-mandatory overflow-x-auto"
          : "snap-y snap-mandatory overflow-y-auto"
        }`}
    >
      {items.map((it, i) => (
        <Slide
          key={it.id}
          item={it}
          horizontal={horizontal}
          eager={Math.abs(i - index) <= 2}
        />
      ))}
    </div>
  );
}

function Slide({
  item,
  horizontal,
  eager,
}: {
  item: Item;
  horizontal: boolean;
  eager: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`relative flex h-full snap-start snap-always items-center justify-center ${horizontal ? "w-full shrink-0" : ""
        }`}
    >
      {!loaded && (
        <div className="img-skeleton absolute inset-4 bottom-16 rounded-md sm:inset-10 sm:bottom-16" />
      )}
      <img
        src={item.imageUrl}
        alt={item.title}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`max-h-full max-w-full object-contain p-2 pb-16 transition-opacity duration-300 sm:p-6 sm:pb-16 ${loaded ? "opacity-100" : "opacity-0"
          }`}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Details({ item }: { item: Item }) {
  return (
    <>
      <h2 className="text-lg font-semibold leading-tight">{item.title}</h2>
      <p className="mt-1 text-sm text-zinc-400">
        {item.category && (
          <span className="font-semibold text-zinc-200">{item.category}</span>
        )}
        {item.category && item.captureDate ? " · " : ""}
        {fmtDate(item.captureDate)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() =>
            downloadImage(
              item.fullImageUrl || item.imageUrl,
              `${slugify(item.title)}.jpg`,
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-sky-400/80 px-3.5 py-2 text-sm font-semibold text-[#04121f] hover:bg-sky-300
          
          border transition backdrop-blur-xs border-sky-400"
        >
          <LuDownload className="h-4 w-4" /> Download
        </button>
        <a
          href={item.fullImageUrl || item.imageUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-white/2 backdrop-blur-xs px-3.5 py-2 text-sm text-zinc-300 hover:border-zinc-500 hover:bg-white/10"
        >
          Open original <LuArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      {item.note ? (
        <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-200">
          {item.note}
        </p>
      ) : null}

      <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-300">
        {item.description || "No description provided."}
      </p>

      {item.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 16).map((t) => (
            <span
              key={t}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[0.72rem] text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <dl className="mt-5 grid gap-2 border-t border-zinc-800 pt-4 text-sm">
        {item.takenBy && <Row label="Taken by">{item.takenBy}</Row>}
        {item.device && <Row label="Device">{item.device}</Row>}
        {item.captureDate && (
          <Row label="Captured">{fmtDate(item.captureDate)}</Row>
        )}
        {item.width && item.height ? (
          <Row label="Dimensions">
            {item.width} × {item.height}
          </Row>
        ) : null}
        {item.license && <Row label="License">{item.license}</Row>}
        {item.sourceUrl && (
          <Row label="Source">
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-0.5 text-sky-400 hover:underline"
            >
              {hostOf(item.sourceUrl)}
              <LuArrowUpRight className="h-3.5 w-3.5" />
            </a>
            {item.sourceUrl2 && (
              <>
                {" · "}
                <a
                  href={item.sourceUrl2}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-0.5 text-sky-400 hover:underline"
                >
                  {hostOf(item.sourceUrl2)}
                  <LuArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </>
            )}
          </Row>
        )}
      </dl>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-2.5">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-zinc-300">{children}</dd>
    </div>
  );
}

/* The same 6-layer progressive backdrop blur as the header, flipped. */
function FooterBlur() {
  return (
    <div className="footer-blur-wrap" aria-hidden="true">
      <div className="footer-blur-panel is-1" />
      <div className="footer-blur-panel is-2" />
      <div className="footer-blur-panel is-3" />
      <div className="footer-blur-panel is-4" />
      <div className="footer-blur-panel is-5" />
      <div className="footer-blur-panel is-6" />
    </div>
  );
}

/* Mobile details sheet — slides up (CSS), and can be flicked down by the handle. */
function BottomSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const active = useRef(false);
  const startY = useRef(0);
  const dragYRef = useRef(0);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onClose();
  }, [onClose]);

  const close = useCallback(() => {
    if (closing) return;
    active.current = false;
    setDragging(false);
    setClosing(true);
    window.setTimeout(finish, 280); // fallback if transitionend doesn't fire
  }, [closing, finish]);

  return (
    <div className="fixed inset-0 z-40 md:hidden" onClick={close}>
      <div
        className="absolute inset-0 animate-[kalp-fade-in_0.2s_ease] bg-black/50 transition-opacity duration-200"
        style={{ opacity: closing ? 0 : 1 }}
      />
      <div
        className={`thin-scroll absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-zinc-800 bg-zinc-950/50 backdrop-blur-xs pb-10 ${closing || dragY ? "" : "animate-[kalp-sheet-up_0.24s_ease]"
          }`}
        style={{
          transform: closing
            ? "translateY(100%)"
            : dragY
              ? `translateY(${dragY}px)`
              : undefined,
          transition: dragging ? "none" : "transform 0.24s ease",
        }}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={(e) => {
          if (closing && e.propertyName === "transform") finish();
        }}
      >
        <div
          className="flex touch-none cursor-grab justify-center py-3.5 active:cursor-grabbing"
          onTouchStart={(e) => {
            startY.current = e.touches[0].clientY;
            active.current = true;
            setDragging(true);
          }}
          onTouchMove={(e) => {
            if (!active.current) return;
            const dy = Math.max(0, e.touches[0].clientY - startY.current);
            dragYRef.current = dy;
            setDragY(dy);
          }}
          onTouchEnd={() => {
            active.current = false;
            setDragging(false);
            if (dragYRef.current > 90) close();
            else {
              dragYRef.current = 0;
              setDragY(0);
            }
          }}
        >
          <div className="h-1 w-10 rounded-full bg-zinc-600" />
        </div>
        <div className="px-5">{children}</div>
      </div>
    </div>
  );
}
