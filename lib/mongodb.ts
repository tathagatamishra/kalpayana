import { setServers } from "node:dns";
import { MongoClient, type Db, type Collection } from "mongodb";
import type { CategoryDoc, ItemDoc } from "./types";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "kalpayana";

if (!uri) {
  throw new Error(
    "MONGODB_URI is not set. Add it to .env.local (local) and to the Vercel project's environment variables.",
  );
}

// Optional escape hatch: some machines (VPNs, corporate DNS) can't resolve the
// SRV records a `mongodb+srv://` URI needs ("querySrv ECONNREFUSED"). Set
// DNS_SERVERS="1.1.1.1,8.8.8.8" to override, or — more reliably — use the plain
// `mongodb://host1,host2,host3/?replicaSet=...` form of the URI (see .env.example),
// which resolves via the OS and sidesteps the problem entirely.
if (process.env.DNS_SERVERS && !process.env.VERCEL) {
  try {
    setServers(
      process.env.DNS_SERVERS.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  } catch {
    /* ignore */
  }
}

// Cache the connection promise across hot-reloads (dev) and lambda invocations (prod).
// If a connection attempt fails, drop the cache so the next request retries.
declare global {
  var _kalpMongo: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const client = new MongoClient(uri as string, { maxPoolSize: 10 });
  return client.connect().catch((err) => {
    global._kalpMongo = undefined;
    throw err;
  });
}

export function clientPromise(): Promise<MongoClient> {
  if (!global._kalpMongo) global._kalpMongo = connect();
  return global._kalpMongo;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  return client.db(dbName);
}

export async function collections(): Promise<{
  items: Collection<ItemDoc>;
  categories: Collection<CategoryDoc>;
}> {
  const db = await getDb();
  return {
    items: db.collection<ItemDoc>("items"),
    categories: db.collection<CategoryDoc>("categories"),
  };
}
