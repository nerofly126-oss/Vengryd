# vengryd

**An Afrocentric, hyper-local marketplace** that connects buyers with nearby product sellers and service vendors — barbers, stylists, gadget shops, tailors, food, pet goods and more. Vendors set up a storefront, list products/services, and get discovered by people in their area; buyers browse, chat, pay, and track orders — all in one place.

> Currency is Nigerian Naira (₦). Payments run through Paystack (currently in test mode).

---

## What the app does

### For buyers
- **Marketplace** (`/marketplace`) — browse featured products and vendors in a Jumia-style grid.
- **Universal search** — a typeahead that suggests matching products and vendors after a couple of characters.
- **Vendors near you** — uses your **GPS location** (reverse-geocoded to a place name) to rank vendors by real distance; falls back to a manual area if you decline location. Up to 7 shown in a horizontal rail with "view more".
- **Hot Deals** — a promo banner on the dashboard linking to a dedicated `/deals` page.
- **Cart & wishlist** — persisted locally; add-to-cart is gated to vendors who've set up payouts.
- **Checkout** — pays via Paystack; a single payment is **auto-split** across every vendor in the cart.
- **My Orders** (`/orders`) — order history with per-item fulfilment status.
- **Messaging** (`/messages`) — realtime chat with vendors (read receipts, WhatsApp-style mobile view).

### For sellers/vendors
- **Seller dashboard** (`/seller`) with a bottom tab bar:
  - **Overview** — revenue, orders, units sold, pending fulfilment, and a shareable storefront link.
  - **Orders** — incoming paid orders with a "mark fulfilled" toggle per item.
  - **Products** — create/edit products with image upload.
  - **Profile** — public storefront: cover image, avatar, tagline, bio, business hours, services, contact details, social links, and **GPS shop location**.
  - **Payouts** — connect a bank account; creates a **Paystack subaccount** so sales auto-settle (minus a 10% platform fee).
- **Seller inbox** (`/seller/messages`) — kept separate from the buyer inbox even on the same account.
- **Public vendor profile** (`/vendor/<slug>`) — cover banner, verified badge, open/closed status, ratings, products, and a share button.

### Accounts
- Email/password and **Google OAuth** sign-in.
- **Unique usernames** with live availability checking.
- Light/dark theme (default dark), toggled in Settings.

---

## Tech stack

- **Frontend:** Vite · React 18 · TypeScript · Tailwind CSS · framer-motion · lucide-react · @tanstack/react-query · react-router-dom 6 · next-themes · sonner
- **Backend:** Supabase — Postgres (with Row Level Security), Auth, Storage, Realtime, and Edge Functions (Deno)
- **Payments:** Paystack (inline checkout + split subaccounts + webhook)
- **Hosting:** Vercel (SPA) with GitHub Actions CI
- **Fonts:** Urbanist (body/display) + Fraunces (editorial headings)

---

## Project structure

```
src/
  lib/              data + logic layer (one file per domain)
    supabase.ts       Supabase client + isConfigured guard
    auth.ts           current user, sign out, display helpers
    catalog.ts        categories / products / vendors queries + types
    seller.ts         seller product/vendor CRUD + image upload
    orders.ts         checkout, buyer orders, seller orders, fulfilment
    payments.ts       Paystack inline checkout + verify
    payout.ts         bank list + subaccount setup
    messaging.ts      conversations, messages, realtime, read receipts
    location.ts       buyer GPS coords, distance, reverse geocode
    store.ts          cart + wishlist (localStorage, useSyncExternalStore)
    profile.ts        profile helpers
    share.ts          native share / copy link
  pages/            one component per route (BuyerDashboard, SellerDashboard,
                    VendorProfile, Messages, Orders, HotDeals, Auth, Settings,
                    Index, Terms, Privacy, NotFound)
  components/        UI building blocks (Navbar, Hero, catalog-cards, SearchBox,
                    SellerNav, etc.); src/components/ui = shadcn primitives
supabase/
  migrations/       SQL schema + RLS policies (run in order)
  functions/        Deno edge functions (paystack, paystack-webhook, order-notifications)
```

Every function/component has an explanatory comment above it.

---

## Getting started

### 1. Install
```bash
npm install
```

### 2. Environment variables (`.env`)
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxx
```
> Never put the Supabase service-role key or the Paystack **secret** key in `VITE_*` — those live only in edge-function secrets.

### 3. Run
```bash
npm run dev        # http://localhost:5173
npm run build      # production build
```

---

## Supabase setup

1. **Run the migrations** in `supabase/migrations/` (in filename order) via the SQL editor — they create the tables (categories, products, vendors, profiles, orders, order_items, conversations, messages, vendor_ratings, vendor_payouts) plus **Row Level Security** policies, triggers, the storage bucket, slugs, ratings, geo, and rate limits.
2. **Storage:** the `catalog-images` bucket is created by the migrations (public read, per-user write, 5MB image-only limit).
3. **Auth → Providers → Google:** enable and paste your Google OAuth Client ID + Secret; add your app URLs under **URL Configuration → Redirect URLs**.
4. **Edge functions** (deploy via CLI or dashboard):
   - `paystack` — bank list, account resolution, subaccount creation, payment verify. Secret: `PAYSTACK_SECRET_KEY`.
   - `paystack-webhook` — confirms payments server-side. Deploy with **Verify JWT off**. Secret: `PAYSTACK_SECRET_KEY` (the webhook is authenticated via the `x-paystack-signature` header, which Paystack signs with that same secret — point your Paystack dashboard webhook URL at this function).

---

## Payments (Paystack)

- Checkout opens the Paystack modal with a `subaccounts` split — one entry per vendor in the cart.
- Payment is **verified server-side** (the edge function re-checks the transaction with the secret key) — never trusted from the client — and a signed webhook confirms it independently.
- Going live: complete BVN/KYC, switch to live keys (`VITE_PAYSTACK_PUBLIC_KEY` + `PAYSTACK_SECRET_KEY`), and vendors re-save payout to create live subaccounts.

---

## Security

- **Row Level Security** on every table — the public anon key can only do what the policies allow (public read on catalog; owner-scoped writes; participant-scoped orders/messages/payouts).
- Server-side payment verification + signed webhook.
- DB **rate limits** on messages, orders, and ratings; ratings restricted to confirmed buyers.
- **CSP** and security headers (`X-Frame-Options`, HSTS, etc.) in `vercel.json`.
- Storage uploads bounded to images ≤5MB, scoped to each user's folder.

---

## Deployment

Deployed on **Vercel** as a static SPA (`vercel.json` rewrites all routes to `index.html`). Pushing to `master` triggers CI; the production deploy is promoted from the dashboard.
