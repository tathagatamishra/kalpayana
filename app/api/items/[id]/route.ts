import { NextResponse, type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";
import { normalizeItem, serializeItem, toObjectId } from "@/lib/models";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { items } = await collections();
  const doc = await items.findOne({ _id });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ item: serializeItem(doc) });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const body = await req.json();
    const doc = normalizeItem(body);
    if (!doc.imageUrl || !doc.title) {
      return NextResponse.json(
        { error: "Image URL and title are required." },
        { status: 400 },
      );
    }
    const { items } = await collections();
    const updated = await items.findOneAndUpdate(
      { _id },
      { $set: { ...doc, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ item: serializeItem(updated) });
  } catch (err) {
    console.error("PATCH /api/items/[id]", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { items } = await collections();
  const r = await items.deleteOne({ _id });
  return NextResponse.json({ ok: true, deleted: r.deletedCount });
}
