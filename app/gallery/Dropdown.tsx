"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { LuCheck, LuChevronDown } from "react-icons/lu";

export type Option = { value: string; label: string; icon?: ReactNode };

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  /** Which way the list opens. Default "up" (controls sit at the bottom). */
  direction?: "up" | "down";
  align?: "start" | "end";
  className?: string;
  buttonClassName?: string;
  ariaLabel?: string;
};

export default function Dropdown({
  value,
  options,
  onChange,
  direction = "up",
  align = "end",
  className = "",
  buttonClassName = "",
  ariaLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-200 outline-none hover:border-zinc-700 focus-visible:border-sky-500 ${buttonClassName}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {current?.icon}
          <span className="truncate">{current?.label}</span>
        </span>
        <LuChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-50 min-w-[10rem] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xs p-1 shadow-2xl shadow-black/60 ${
            direction === "up" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${align === "end" ? "right-0" : "left-0"}`}
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                    selected
                      ? "bg-sky-400/15 text-sky-300"
                      : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-1.5">
                    {o.icon}
                    <span className="truncate">{o.label}</span>
                  </span>
                  {selected && (
                    <LuCheck
                      aria-hidden="true"
                      className="h-3.5 w-3.5 shrink-0 text-sky-400"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
