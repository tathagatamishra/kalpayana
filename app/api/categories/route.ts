import { NextResponse, type NextRequest } from "next/server";
import { collections } from "@/lib/mongodb";
import { isAdmin } from "@/lib/auth";
import { slugify, serializeCategory } from "@/lib/models";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { categories, items } = await collections();
    const [cats, counts] = await Promise.all([
      categories.find({}).sort({ name: 1 }).toArray(),
      items
        .aggregate<{ _id: string; n: number }>([
          { $group: { _id: "$category", n: { $sum: 1 } } },
        ])
        .toArray(),
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.n]));
    const total = counts.reduce((a, c) => a + c.n, 0);
    return NextResponse.json({
      total,
      categories: cats.map((c) => serializeCategory(c, countMap.get(c.name) ?? 0)),
    });
  } catch (err) {
    console.error("GET /api/categories", err);
    return NextResponse.json(
      { error: "Failed to load categories", categories: [], total: 0 },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const name = String(body.name || "")
      .trim()
      .slice(0, 120);
    if (!name)
      return NextResponse.json(
        { error: "Category name is required." },
        { status: 400 },
      );
    const slug = slugify(name);
    const { categories } = await collections();
    const existing = await categories.findOne({ slug });
    if (existing)
      return NextResponse.json(
        { category: serializeCategory(existing, 0), existed: true },
        { status: 200 },
      );
    const doc = {
      name,
      slug,
      description: String(body.description || "")
        .trim()
        .slice(0, 500),
      createdAt: new Date(),
    };
    const r = await categories.insertOne(doc);
    return NextResponse.json(
      { category: serializeCategory({ ...doc, _id: r.insertedId }, 0) },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/categories", err);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
