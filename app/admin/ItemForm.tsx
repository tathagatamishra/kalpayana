"use client";

import { useState, type FormEvent } from "react";
import { LuPlus } from "react-icons/lu";
import Dropdown from "../gallery/Dropdown";
import type { Category, Item } from "@/lib/types";

const NEW_CAT = "__new__";

const inputCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-900";
const labelCls = "text-xs text-zinc-400";

type FormState = {
  title: string;
  imageUrl: string;
  thumbUrl: string;
  fullImageUrl: string;
  tags: string;
  description: string;
  captureDate: string;
  sourceUrl: string;
  sourceUrl2: string;
  takenBy: string;
  device: string;
  license: string;
  note: string;
};

const empty: FormState = {
  title: "",
  imageUrl: "",
  thumbUrl: "",
  fullImageUrl: "",
  tags: "",
  description: "",
  captureDate: "",
  sourceUrl: "",
  sourceUrl2: "",
  takenBy: "",
  device: "",
  license: "",
  note: "",
};

type Props = {
  categories: Category[];
  initial?: Item | null;
  onSaved?: (item: Item) => void;
  onCancel?: () => void;
  onCategoryCreated?: () => void;
};

export default function ItemForm({
  categories,
  initial,
  onSaved,
  onCancel,
  onCategoryCreated,
}: Props) {
  const [f, setF] = useState<FormState>(() => ({
    ...empty,
    ...(initial
      ? {
          title: initial.title,
          imageUrl: initial.imageUrl,
          thumbUrl: initial.thumbUrl,
          fullImageUrl: initial.fullImageUrl,
          tags: (initial.tags || []).join(", "),
          description: initial.description,
          captureDate: initial.captureDate,
          sourceUrl: initial.sourceUrl,
          sourceUrl2: initial.sourceUrl2,
          takenBy: initial.takenBy,
          device: initial.device,
          license: initial.license,
          note: initial.note,
        }
      : {}),
  }));

  const [dims, setDims] = useState<{ w: number; h: number } | null>(
    initial?.width && initial?.height
      ? { w: initial.width, h: initial.height }
      : null,
  );

  const initialCatExists =
    !!initial?.category && categories.some((c) => c.name === initial.category);
  const [catMode, setCatMode] = useState<string>(
    initialCatExists
      ? (initial as Item).category
      : initial?.category
        ? NEW_CAT
        : (categories[0]?.name ?? NEW_CAT),
  );
  const [newCat, setNewCat] = useState(
    catMode === NEW_CAT && initial?.category ? initial.category : "",
  );

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "err" | "ok"; text: string } | null>(
    null,
  );

  const set =
    (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setF((s) => ({ ...s, [k]: v }));
      if (k === "imageUrl" || k === "thumbUrl") setDims(null);
    };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    let category = catMode;
    if (catMode === NEW_CAT) {
      const name = newCat.trim();
      if (!name) return setMsg({ type: "err", text: "Enter a category name." });
      category = name;
    }
    if (!f.imageUrl.trim() || !f.title.trim()) {
      return setMsg({ type: "err", text: "Image URL and title are required." });
    }

    setBusy(true);
    try {
      if (catMode === NEW_CAT) {
        const cr = await fetch("/api/categories", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: category }),
        });
        if (!cr.ok) {
          const d = await cr.json().catch(() => ({}));
          throw new Error(d.error || "Could not create category.");
        }
        const d = await cr.json();
        category = d.category?.name || category;
        onCategoryCreated?.();
      }

      const payload = {
        ...f,
        category,
        width: dims?.w ?? null,
        height: dims?.h ?? null,
      };
      const url = initial ? `/api/items/${initial.id}` : "/api/items";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed.");

      setMsg({ type: "ok", text: initial ? "Updated." : "Added to gallery." });
      if (!initial) {
        setF({ ...empty });
        setDims(null);
        setCatMode(category);
        setNewCat("");
      }
      onSaved?.(data.item);
    } catch (err) {
      setMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Save failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Category *</label>
          <Dropdown
            value={catMode}
            onChange={setCatMode}
            direction="down"
            align="start"
            className="w-full"
            buttonClassName="w-full justify-between rounded-lg bg-zinc-950 py-2"
            ariaLabel="Category"
            options={[
              ...categories.map((c) => ({ value: c.name, label: c.name })),
              {
                value: NEW_CAT,
                label: "New category…",
                icon: <LuPlus className="h-3.5 w-3.5 text-sky-400" />,
              },
            ]}
          />
          {catMode === NEW_CAT && (
            <input
              type="text"
              placeholder="New category name"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className={inputCls}
            />
          )}
        </div>

        <Field label="Image capture date">
          <input
            type="text"
            placeholder="e.g. 2026-04-06 or April 2026"
            value={f.captureDate}
            onChange={set("captureDate")}
            className={inputCls}
          />
        </Field>

        <Field label="Title *" full>
          <input
            type="text"
            value={f.title}
            onChange={set("title")}
            required
            className={inputCls}
          />
        </Field>

        <Field
          label="Image URL *"
          full
          hint="Direct link to the image file — this is what the gallery displays."
        >
          <input
            type="url"
            placeholder="https://…"
            value={f.imageUrl}
            onChange={set("imageUrl")}
            required
            className={inputCls}
          />
        </Field>

        <Field
          label="Thumbnail URL"
          hint="optional — smaller version for the grid"
        >
          <input
            type="url"
            value={f.thumbUrl}
            onChange={set("thumbUrl")}
            className={inputCls}
          />
        </Field>
        <Field
          label="Full-resolution URL"
          hint="optional — used by Download / Open original"
        >
          <input
            type="url"
            value={f.fullImageUrl}
            onChange={set("fullImageUrl")}
            className={inputCls}
          />
        </Field>

        <Field
          label="Tags"
          full
          hint="comma separated — e.g. mars, rover, telescope"
        >
          <input
            type="text"
            value={f.tags}
            onChange={set("tags")}
            className={inputCls}
          />
        </Field>

        <Field label="Description" full>
          <textarea
            value={f.description}
            onChange={set("description")}
            className={`${inputCls} min-h-24 resize-y`}
          />
        </Field>

        <Field label="Image taken by" hint="photographer / credit">
          <input
            type="text"
            value={f.takenBy}
            onChange={set("takenBy")}
            className={inputCls}
          />
        </Field>
        <Field
          label="Device"
          hint="optional — camera / telescope / instrument used"
        >
          <input
            type="text"
            placeholder="e.g. Nikon Z9, JWST NIRCam"
            value={f.device}
            onChange={set("device")}
            className={inputCls}
          />
        </Field>

        <Field label="License" hint="optional — e.g. CC BY 4.0, Public domain">
          <input
            type="text"
            value={f.license}
            onChange={set("license")}
            className={inputCls}
          />
        </Field>
        <Field label="Source link" hint="page the image came from">
          <input
            type="url"
            value={f.sourceUrl}
            onChange={set("sourceUrl")}
            className={inputCls}
          />
        </Field>

        <Field label="Second source link" hint="optional">
          <input
            type="url"
            value={f.sourceUrl2}
            onChange={set("sourceUrl2")}
            className={inputCls}
          />
        </Field>
        <Field
          label="Note"
          hint="optional — a caveat shown above the description"
        >
          <input
            type="text"
            value={f.note}
            onChange={set("note")}
            className={inputCls}
          />
        </Field>
      </div>

      {f.imageUrl && (
        <div className="mt-3.5 flex items-end gap-3">
          <img
            src={f.thumbUrl || f.imageUrl}
            alt="preview"
            onLoad={(e) => {
              const el = e.currentTarget;
              if (el.naturalWidth && el.naturalHeight)
                setDims({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            className="max-h-40 rounded-lg border border-zinc-800"
          />
          <span className="text-[0.7rem] text-zinc-500">
            {dims
              ? `${dims.w} × ${dims.h} px (used for the grid aspect ratio)`
              : "reading dimensions…"}
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          disabled={busy}
          className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-[#04121f] hover:bg-sky-300 disabled:opacity-50"
        >
          {busy ? "Saving…" : initial ? "Save changes" : "Add to gallery"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
          >
            Cancel
          </button>
        )}
        {msg && (
          <span
            className={`text-sm ${msg.type === "err" ? "text-red-400" : "text-emerald-400"}`}
          >
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <span className="text-[0.7rem] text-zinc-500">{hint}</span>}
    </div>
  );
}
