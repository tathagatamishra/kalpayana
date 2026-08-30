import Gallery from "./Gallery";
import { collections } from "@/lib/mongodb";
import { serializeItem, serializeCategory } from "@/lib/models";
import type { Category, Item } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 48;

type Initial = {
  ok: boolean;
  items: Item[];
  total: number;
  pageSize: number;
  categories: Category[];
};

async function loadInitial(): Promise<Initial> {
  try {
    const { items, categories } = await collections();
    const [docs, total, cats, counts] = await Promise.all([
      items
        .find({})
        .sort({ captureDate: -1, createdAt: -1, _id: -1 })
        .limit(PAGE_SIZE)
        .toArray(),
      items.countDocuments({}),
      categories.find({}).sort({ name: 1 }).toArray(),
      items
        .aggregate<{ _id: string; n: number }>([
          { $group: { _id: "$category", n: { $sum: 1 } } },
        ])
        .toArray(),
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.n]));
    return {
      ok: true,
      items: docs.map(serializeItem),
      total,
      pageSize: PAGE_SIZE,
      categories: cats.map((c) => serializeCategory(c, countMap.get(c.name) ?? 0)),
    };
  } catch (err) {
    console.error("home loadInitial", err);
    return { ok: false, items: [], total: 0, pageSize: PAGE_SIZE, categories: [] };
  }
}

export default async function HomePage() {
  const data = await loadInitial();

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 h-16 sm:h-20">
        {/* progressive blur behind the bar */}
        <div className="header-blur-wrap" aria-hidden="true">
          <div className="header-blur-panel is-1" />
          <div className="header-blur-panel is-2" />
          <div className="header-blur-panel is-3" />
          <div className="header-blur-panel is-4" />
          <div className="header-blur-panel is-5" />
          <div className="header-blur-panel is-6" />
        </div>

        <div className="relative z-[1] mx-auto flex h-full max-w-[1500px] items-center px-5">
          <span className="font-(family-name:--font-solar) text-xl tracking-wide sm:text-3xl mb-3 select-none">
            KALPA<span className="text-sky-400">YANA</span>
          </span>
        </div>
      </header>

      <main className="flex-1 pt-16 sm:pt-20">
        {!data.ok && (
          <p className="mx-auto max-w-[1500px] px-5 pt-3 text-sm text-red-400">
            Could not reach the database. Check <code>MONGODB_URI</code> in your
            environment.
          </p>
        )}
        <Gallery
          initialItems={data.items}
          initialTotal={data.total}
          pageSize={data.pageSize}
          categories={data.categories}
        />
      </main>
    </>
  );
}
