# kalpayana

An online gallery for **scientific imagery** of any kind. Every image is stored as a link
(not a file) together with its full story — title, tags, description, capture date, source
link, who took it and the device used — and organised into categories you create and manage
from an `/admin` panel.

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4**
- **MongoDB** (`mongodb` driver — Atlas free tier is fine)
- Images are referenced by URL and rendered with lazy `<img>` — nothing is re-hosted, so
  deploys stay tiny and images load straight from their own CDNs.
- **Row-wise ("Pinterest") masonry** (`app/gallery/Masonry.tsx`): a JS layout that drops each
  item into the currently shortest column, so the fill order runs left→right, top→bottom.
  Card height is reserved from the image aspect ratio; a shimmer shows, then the image fades
  in — no reflow.
- Controls (search / sort / category chips) are a **fixed bar at the bottom** of the
  viewport, over a progressive backdrop blur. The sort/category selectors are a themed
  custom dropdown (`app/gallery/Dropdown.tsx`), not native `<select>`.
- On touch screens the per-card category label is hidden and fades in for ~1s while the
  page is scrolling.
- Fullscreen modal (`app/gallery/ImageModal.tsx`) with a **sticky footer** (Close +
  Swipe/Reel toggle):
  - **Swipe view** — one image; keyboard arrows and desktop prev/next buttons, swipe
    left/right on touch. The image sits in a fixed-height box so it never collapses while
    a new image loads; neighbours are preloaded.
  - **Reel view** — Instagram/TikTok-style vertical scroll-snap feed.
  - **Download** button (blob download, falls back to a new tab if the host blocks CORS),
    plus every field including device and pixel dimensions.
- The header is just the logo over a progressive ("gradient") backdrop blur.
- **Hosting:** Vercel (framework auto-detected, no config)

## Local setup

```bash
npm install
cp .env.example .env.local      # fill in the values (see below)
npm run seed                    # optional: load the 264 starter images
npm run dev                     # http://localhost:3000
```

`.env.local` (and Vercel → Settings → Environment Variables):

| key | purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB` | database name (default `kalpayana`) |
| `ADMIN_PASSWORD` | password for `/admin` — **change the default** |
| `DNS_SERVERS` | optional, e.g. `1.1.1.1,8.8.8.8` — see below |

> **`querySrv ECONNREFUSED`?** Some networks (VPNs, corporate DNS) can't resolve
> the SRV records a `mongodb+srv://` URI needs. Use the **plain connection string**
> instead — `mongodb://host1,host2,host3/?replicaSet=…&ssl=true&authSource=admin` —
> which resolves through the OS and sidesteps SRV entirely. `.env.example` shows
> both forms. The plain form also works on Vercel, so you can use one URI
> everywhere.

## Admin — `/admin`

Sign in with `ADMIN_PASSWORD`. Two tabs:

- **Content** — add an image (image URL, title, tags, description, capture date, source
  link, taken-by, plus optional thumbnail / full-res / license / note), then edit or delete
  any entry. Search + filter by category, paginated. When adding you pick an existing
  category **or** choose "＋ New category…" to create one inline.
- **Categories** — create, rename (existing images follow the rename), or delete a category
  (delete asks whether to keep its images as *uncategorised* or remove them too).

## Public gallery — `/`

Masonry grid, category chips with counts, live search, sort, infinite scroll. Clicking an
image opens a modal with every field and links back to the original source(s).
Arrow keys / Esc work.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Vercel → **Add New Project** → import the repo. Next.js is detected; no build settings to
   change.
3. Add `MONGODB_URI`, `MONGODB_DB`, `ADMIN_PASSWORD` for Production (and Preview).
4. MongoDB Atlas → **Network Access** → allow `0.0.0.0/0` (Vercel function IPs aren't
   static).
5. Deploy. To load starter data into the production DB, run `npm run seed` locally with the
   production `MONGODB_URI` in `.env.local`.

## API

| method | route | auth | purpose |
|---|---|---|---|
| GET | `/api/items?category=&q=&sort=&page=&limit=` | – | list / search |
| POST | `/api/items` | admin | create |
| PATCH · DELETE | `/api/items/:id` | admin | update / delete |
| GET | `/api/categories` | – | list with counts |
| POST | `/api/categories` | admin | create |
| PATCH · DELETE | `/api/categories/:id` | admin | rename / delete (`?mode=unassign\|purge`) |
| POST | `/api/auth/login` · `/api/auth/logout` | – | session cookie |

Auth is a single shared password → httpOnly session cookie (SHA-256 of the password).
Good enough for a single-owner gallery; swap in a real provider to add editors.

## Project layout

```
app/
  page.tsx  Gallery.tsx            public gallery
  admin/  layout.tsx (auth gate)  page.tsx  Dashboard.tsx  ItemForm.tsx  Categories.tsx  LoginForm.tsx
  api/  items/  categories/  auth/
lib/  mongodb.ts  auth.ts  models.ts  types.ts
scripts/  seed.mjs  seed-data.json
```
