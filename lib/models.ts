import { ObjectId } from "mongodb";
import type {
  Category,
  CategoryDoc,
  Item,
  ItemDoc,
  ItemInput,
} from "./types";

export function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(String(id));
  } catch {
    return null;
  }
}

const strip = (v: unknown, max = 4000): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Normalise an item payload from the admin form into a DB document (minus timestamps). */
export function normalizeItem(body: ItemInput = {}): Omit<
  ItemDoc,
  "_id" | "createdAt" | "updatedAt"
> {
  const rawTags = Array.isArray(body.tags)
    ? body.tags
    : String(body.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

  const captureDateText = strip(body.captureDate, 60);
  let captureDate: Date | null = null;
  if (captureDateText) {
    const d = new Date(captureDateText);
    if (!isNaN(d.getTime())) captureDate = d;
  }

  const dim = (v: unknown): number | null => {
    const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };

  return {
    title: strip(body.title, 300),
    category: strip(body.category, 120),
    imageUrl: strip(body.imageUrl, 2000),
    thumbUrl: strip(body.thumbUrl, 2000),
    fullImageUrl: strip(body.fullImageUrl, 2000),
    description: strip(body.description, 8000),
    tags: [...new Set(rawTags.map((t) => t.slice(0, 60)))].slice(0, 40),
    captureDate,
    captureDateText,
    sourceUrl: strip(body.sourceUrl, 2000),
    sourceUrl2: strip(body.sourceUrl2, 2000),
    takenBy: strip(body.takenBy, 300),
    device: strip(body.device, 200),
    license: strip(body.license, 200),
    note: strip(body.note, 1000),
    width: dim(body.width),
    height: dim(body.height),
  };
}

export function serializeItem(doc: ItemDoc): Item {
  return {
    id: String(doc._id),
    title: doc.title || "",
    category: doc.category || "",
    imageUrl: doc.imageUrl || "",
    thumbUrl: doc.thumbUrl || doc.imageUrl || "",
    fullImageUrl: doc.fullImageUrl || "",
    description: doc.description || "",
    tags: doc.tags || [],
    captureDate: doc.captureDateText || "",
    sourceUrl: doc.sourceUrl || "",
    sourceUrl2: doc.sourceUrl2 || "",
    takenBy: doc.takenBy || "",
    device: doc.device || "",
    license: doc.license || "",
    note: doc.note || "",
    width: doc.width ?? null,
    height: doc.height ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

export function serializeCategory(doc: CategoryDoc, count?: number): Category {
  return {
    id: String(doc._id),
    name: doc.name || "",
    slug: doc.slug || slugify(doc.name),
    description: doc.description || "",
    count: typeof count === "number" ? count : undefined,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
  };
}
