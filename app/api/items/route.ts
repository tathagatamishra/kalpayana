import { NextResponse, type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";
import { normalizeItem, serializeItem } from "@/lib/models";
import type { Filter, Sort } from "mongodb";
import type { ItemDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

function escapeRx(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const category = (sp.get("category") || "").trim();
    const q = (sp.get("q") || "").trim();
    const sort = sp.get("sort") || "new";
    const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
    const limit = Math.min(
      96,
      Math.max(1, parseInt(sp.get("limit") || "48", 10) || 48),
    );

    const filter: Filter<ItemDoc> = {};
    if (category && category.toLowerCase() !== "all") filter.category = category;
    if (q) {
      const rx = new RegExp(escapeRx(q), "i");
      filter.$or = [
        { title: rx },
        { description: rx },
        { tags: rx },
        { takenBy: rx },
        { category: rx },
      ];
    }

    // _id is the tiebreaker — without it, ties on captureDate/createdAt give an
    // unstable order and paginated results overlap.
    const sortSpec: Sort =
      sort === "old"
        ? { captureDate: 1, createdAt: 1, _id: 1 }
        : sort === "az"
          ? { title: 1, _id: 1 }
          : { captureDate: -1, createdAt: -1, _id: -1 };

    const { items } = await collections();
    const [docs, total] = await Promise.all([
      items
        .find(filter)
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      items.countDocuments(filter),
    ]);

    return NextResponse.json({
      items: docs.map(serializeItem),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error("GET /api/items", err);
    return NextResponse.json(
      { error: "Failed to load items", items: [], total: 0 },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const doc = normalizeItem(body);
    if (!doc.imageUrl || !doc.title) {
      return NextResponse.json(
        { error: "Image URL and title are required." },
        { status: 400 },
      );
    }
    const now = new Date();
    const full = { ...doc, createdAt: now, updatedAt: now };
    const { items } = await collections();
    const r = await items.insertOne(full);
    return NextResponse.json(
      { item: serializeItem({ ...full, _id: r.insertedId }) },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/items", err);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
