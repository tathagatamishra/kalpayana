// Seed the Kalpayana database from scripts/seed-data.json
//   npm run seed             (skips if items already exist)
//   npm run seed -- --force   (wipes items + categories first)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { setServers } from "node:dns";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(dir, "..", ".env.local") });
dotenv.config({ path: path.join(dir, "..", ".env") });

if (process.env.DNS_SERVERS) {
  try {
    setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean));
  } catch {
    /* ignore */
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "kalpayana";
if (!uri) {
  console.error("MONGODB_URI missing — add it to .env.local");
  process.exit(1);
}

const force = process.argv.includes("--force");
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const seed = JSON.parse(
  readFileSync(path.join(dir, "seed-data.json"), "utf-8"),
);

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);
const Items = db.collection("items");
const Categories = db.collection("categories");

if (force) {
  await Items.deleteMany({});
  await Categories.deleteMany({});
  console.log("Wiped items + categories.");
}

const existing = await Items.estimatedDocumentCount();
if (existing > 0 && !force) {
  console.log(
    `Items collection already has ${existing} docs. Re-run with --force to reseed.`,
  );
  await client.close();
  process.exit(0);
}

await Items.createIndex({ captureDate: -1, createdAt: -1 });
await Items.createIndex({ category: 1 });
await Items.createIndex({ title: 1 });
await Categories.createIndex({ slug: 1 }, { unique: true });

const now = new Date();
for (const c of seed.categories) {
  await Categories.updateOne(
    { slug: slugify(c.name) },
    {
      $setOnInsert: {
        name: c.name,
        slug: slugify(c.name),
        description: c.description || "",
        createdAt: now,
      },
    },
    { upsert: true },
  );
}
console.log(`Categories: ${seed.categories.length}`);

const docs = seed.items.map((it) => {
  const t = (it.captureDate || "").trim();
  const d = t ? new Date(t) : null;
  return {
    title: it.title || "",
    category: it.category || "",
    imageUrl: it.imageUrl || "",
    thumbUrl: it.thumbUrl || "",
    fullImageUrl: it.fullImageUrl || "",
    description: it.description || "",
    tags: Array.isArray(it.tags) ? it.tags : [],
    captureDate: d && !isNaN(d.getTime()) ? d : null,
    captureDateText: t,
    sourceUrl: it.sourceUrl || "",
    sourceUrl2: it.sourceUrl2 || "",
    takenBy: it.takenBy || "",
    device: it.device || "",
    license: it.license || "",
    note: it.note || "",
    width: Number.isFinite(it.width) ? it.width : null,
    height: Number.isFinite(it.height) ? it.height : null,
    createdAt: now,
    updatedAt: now,
  };
});
if (docs.length) await Items.insertMany(docs);
console.log(`Items inserted: ${docs.length}`);

await client.close();
console.log("Done.");
