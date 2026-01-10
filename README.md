
# Store Generator Prototype

Monorepo with:

- `api/`: Express + Prisma
- `web/`: Next.js (App Router)

Tenant is selected via `x-tenant-id` header (use the store slug, e.g. `green-mart`).

## Supabase (Postgres + RLS)

1) Create a Supabase project.

2) In Supabase SQL Editor run:


3) Set API env vars (`api/.env`):


4) Apply migrations + seed:

```bash
cd api
npm i
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

5) Run the web app:

```bash
cd web
npm i
cp .env.example .env.local
npm run dev
```

## Categories (master taxonomy + store-specific)

Categories are store-specific (stored in `Category` scoped by `storeId`), but stores are seeded from a shared master taxonomy (`MasterCategory`).

- `MasterCategory`: global list of category slugs + names.
- `Category`: per-store categories with `sortOrder` and `isActive` for store-specific ordering/visibility.

Seeding behavior:

- `npx prisma db seed` inserts/updates the master taxonomy.
- The API auto-creates missing store categories from the master taxonomy on `POST /stores` and `GET /categories`.

## Web

### Run

`cd web`
`npm install`
`npm run dev`

### Product images (recommended: Supabase Storage)

The UI expects product images in `product.imageUrl`.

Set these env vars for the web app (e.g. in `web/.env.local`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET` (optional, default: `product-images`)

Then create a Supabase Storage bucket (default name: `product-images`). For the prototype, a public bucket is simplest.

You can also upload from terminal:

- `cd web`
- `node scripts/upload-to-supabase-storage.mjs product-images green-mart ~/Downloads/Toor_Dal_images.jpeg`

