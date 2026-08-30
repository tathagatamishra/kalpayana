import { NextResponse, type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";
import { slugify, serializeCategory, toObjectId } from "@/lib/models";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const body = await req.json();
    const { categories, items } = await collections();
    const current = await categories.findOne({ _id });
    if (!current)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const name = String(body.name ?? current.name)
      .trim()
      .slice(0, 120);
    if (!name)
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    const description =
      body.description !== undefined
        ? String(body.description).trim().slice(0, 500)
        : current.description;

    const set = { name, slug: slugify(name), description };
    await categories.updateOne({ _id }, { $set: set });

    let migrated = 0;
    if (name !== current.name) {
      const r = await items.updateMany(
        { category: current.name },
        { $set: { category: name } },
      );
      migrated = r.modifiedCount;
    }
    return NextResponse.json({
      category: serializeCategory({ ...current, ...set }),
      migrated,
    });
  } catch (err) {
    console.error("PATCH /api/categories/[id]", err);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const _id = toObjectId(id);
  if (!_id) return NextResponse.json({ error: "Bad id" }, { status: 400 });
  try {
    const { categories, items } = await collections();
    const cat = await categories.findOne({ _id });
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // A category can only be deleted once it holds no content.
    const assigned = await items.countDocuments({ category: cat.name });
    if (assigned > 0) {
      return NextResponse.json(
        {
          error: `“${cat.name}” still has ${assigned} item(s) assigned. Empty the category before deleting it.`,
        },
        { status: 409 },
      );
    }

    await categories.deleteOne({ _id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/categories/[id]", err);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
