// Paystack server-side endpoint for vengryd.
// Actions (POST JSON { action, ... }):
//   - "banks"      -> list Nigerian banks (for payout setup)
//   - "subaccount" -> resolve the account name + create/refresh a vendor payout subaccount (auth required)
//   - "initialize" -> server-computes the order total + per-vendor split and starts a charge (auth required)
//   - "verify"     -> verify a charge by reference and mark the order paid (auth required)
//
// Secret required: PAYSTACK_SECRET_KEY (set via `supabase secrets set`).
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY are injected by the platform.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PLATFORM_COMMISSION = 10; // percent kept by the platform
// Optional CORS allowlist (comma-separated origins). Falls back to "*" when unset.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsFor(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin =
    ALLOWED_ORIGINS.length === 0 ? "*" : ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, cors: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function psHeaders() {
  return { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" };
}

const admin = () => createClient(SUPABASE_URL, SERVICE_ROLE);

const isString = (v: unknown): v is string => typeof v === "string" && v.length > 0;

async function listBanks(cors: Record<string, string>) {
  const res = await fetch("https://api.paystack.co/bank?currency=NGN&country=nigeria", { headers: psHeaders() });
  const body = await res.json();
  if (!res.ok || !body.status) return json({ error: body.message ?? "Could not load banks." }, cors, 502);
  const banks = ((body.data ?? []) as { code: string; name: string }[]).map((b) => ({ code: b.code, name: b.name }));
  return json({ banks }, cors);
}

// Validates the caller's Supabase JWT using the anon client (least privilege).
async function userFromRequest(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) return null;
  const { data } = await createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE).auth.getUser(token);
  return data.user ?? null;
}

async function createSubaccount(
  req: Request,
  cors: Record<string, string>,
  payload: { bankCode?: unknown; accountNumber?: unknown },
) {
  const user = await userFromRequest(req);
  if (!user) return json({ error: "Not authenticated." }, cors, 401);
  const { bankCode, accountNumber } = payload;
  if (!isString(bankCode) || !isString(accountNumber)) {
    return json({ error: "Bank and account number are required." }, cors, 400);
  }
  if (!/^\d{6,20}$/.test(accountNumber)) return json({ error: "Invalid account number." }, cors, 400);

  const supabase = admin();
  const { data: vendor, error: vErr } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("seller_id", user.id)
    .maybeSingle();
  if (vErr) return json({ error: vErr.message }, cors, 500);
  if (!vendor) return json({ error: "Set up your vendor profile before adding payout details." }, cors, 400);

  // Confirm the account first (Paystack returns the real account holder name).
  const resolveRes = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { headers: psHeaders() },
  );
  const resolve = await resolveRes.json();
  if (!resolveRes.ok || !resolve.status) {
    return json({ error: resolve.message ?? "Couldn't verify that account number." }, cors, 400);
  }
  const accountName: string | null = resolve.data?.account_name ?? null;

  const res = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: psHeaders(),
    body: JSON.stringify({
      business_name: vendor.name,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: PLATFORM_COMMISSION,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.status) return json({ error: body.message ?? "Could not create payout account." }, cors, 400);

  const subaccountCode: string = body.data.subaccount_code;

  const { error: upErr } = await supabase.from("vendor_payouts").upsert({
    vendor_id: vendor.id,
    seller_id: user.id,
    bank_code: bankCode,
    account_number: accountNumber,
    account_name: accountName,
    flw_subaccount_id: subaccountCode,
    updated_at: new Date().toISOString(),
  });
  if (upErr) return json({ error: upErr.message }, cors, 500);

  const { error: vUpErr } = await supabase
    .from("vendors")
    .update({ flw_subaccount_id: subaccountCode })
    .eq("id", vendor.id);
  if (vUpErr) return json({ error: vUpErr.message }, cors, 500);

  return json({ ok: true, accountName, subaccountId: subaccountCode }, cors);
}

type ItemRow = {
  unit_price: number | string;
  quantity: number;
  seller_id: string | null;
};

// Initializes a Paystack charge for an order the caller owns. The amount and the
// per-vendor split are computed from the persisted order_items (never trusted from
// the client), so a tampered client cannot lower the price or reroute funds.
async function initialize(req: Request, cors: Record<string, string>, payload: { orderId?: unknown }) {
  const user = await userFromRequest(req);
  if (!user) return json({ error: "Not authenticated." }, cors, 401);
  const { orderId } = payload;
  if (!isString(orderId)) return json({ error: "Missing order." }, cors, 400);

  const supabase = admin();
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id, buyer_id, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr) return json({ error: oErr.message }, cors, 500);
  if (!order) return json({ error: "Order not found." }, cors, 404);
  if (order.buyer_id !== user.id) return json({ error: "Not your order." }, cors, 403);
  if (order.payment_status === "paid") return json({ error: "Order already paid." }, cors, 409);

  const { data: items, error: iErr } = await supabase
    .from("order_items")
    .select("unit_price, quantity, seller_id")
    .eq("order_id", orderId);
  if (iErr) return json({ error: iErr.message }, cors, 500);
  return await buildAndStart(supabase, cors, order.id, user.email ?? "", items as ItemRow[]);
}

async function buildAndStart(
  supabase: ReturnType<typeof admin>,
  cors: Record<string, string>,
  orderId: string,
  email: string,
  items: ItemRow[],
) {
  if (!items || items.length === 0) return json({ error: "Order has no items." }, cors, 400);
  if (!email) return json({ error: "Missing buyer email." }, cors, 400);

  // Resolve each seller's subaccount. order_items.seller_id references auth.users,
  // while vendors.seller_id stores the matching public vendor/payout row.
  const subBySeller = new Map<string, string>();
  const sellerIds = [...new Set(items.map((i) => i.seller_id).filter(isString))];
  if (sellerIds.length > 0) {
    const { data: vrows } = await supabase
      .from("vendors")
      .select("seller_id, flw_subaccount_id")
      .in("seller_id", sellerIds);
    for (const v of (vrows ?? []) as { seller_id: string; flw_subaccount_id: string | null }[]) {
      if (v.flw_subaccount_id) subBySeller.set(v.seller_id, v.flw_subaccount_id);
    }
  }

  // Total (kobo) and the per-subaccount share (90% of that vendor's subtotal).
  let totalKobo = 0;
  const shareBySub = new Map<string, number>();
  for (const it of items) {
    const lineKobo = Math.round(Number(it.unit_price) * 100) * Number(it.quantity);
    totalKobo += lineKobo;
    const sub = it.seller_id ? subBySeller.get(it.seller_id) : undefined;
    if (!sub) return json({ error: "A vendor in this order can't accept payments yet." }, cors, 400);
    shareBySub.set(sub, (shareBySub.get(sub) ?? 0) + Math.round(lineKobo * (100 - PLATFORM_COMMISSION) / 100));
  }
  if (totalKobo <= 0) return json({ error: "Order total is invalid." }, cors, 400);

  const subaccounts = [...shareBySub.entries()].map(([subaccount, share]) => ({ subaccount, share }));

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: psHeaders(),
    body: JSON.stringify({
      email,
      amount: totalKobo,
      reference: orderId,
      currency: "NGN",
      channels: ["card", "bank_transfer", "ussd", "bank", "qr", "mobile_money"],
      split: { type: "flat", bearer_type: "all-proportional", subaccounts },
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.status) return json({ error: body.message ?? "Could not start payment." }, cors, 502);

  return json(
    { accessCode: body.data.access_code, reference: body.data.reference ?? orderId, amount: totalKobo },
    cors,
  );
}

async function verifyPayment(
  req: Request,
  cors: Record<string, string>,
  payload: { orderId?: unknown; reference?: unknown },
) {
  const user = await userFromRequest(req);
  if (!user) return json({ error: "Not authenticated." }, cors, 401);
  const { orderId, reference } = payload;
  if (!isString(orderId) || !isString(reference)) return json({ error: "Missing order or reference." }, cors, 400);

  const supabase = admin();
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id, buyer_id, total, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr) return json({ error: oErr.message }, cors, 500);
  if (!order) return json({ error: "Order not found." }, cors, 404);
  if (order.buyer_id !== user.id) return json({ error: "Not your order." }, cors, 403);
  if (order.payment_status === "paid") return json({ paid: true }, cors);

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: psHeaders(),
  });
  const body = await res.json();
  const tx = body.data;
  const ok =
    res.ok &&
    body.status === true &&
    tx?.status === "success" &&
    tx?.currency === "NGN" &&
    tx?.reference === order.id &&
    Number(tx?.amount) >= Math.round(Number(order.total) * 100); // Paystack amounts are in kobo

  if (!ok) {
    // Only flag failed if it isn't already paid (don't clobber a confirmed order).
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", orderId).neq("payment_status", "paid");
    return json({ paid: false, error: "Payment could not be verified." }, cors, 400);
  }

  await supabase
    .from("orders")
    .update({ payment_status: "paid", flw_tx_id: String(tx.id ?? reference), paid_at: new Date().toISOString() })
    .eq("id", orderId)
    .neq("payment_status", "paid");
  return json({ paid: true }, cors);
}

Deno.serve(async (req: Request) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!PAYSTACK_SECRET) return json({ error: "Paystack is not configured." }, cors, 500);

  try {
    const payload = await req.json();
    switch (payload.action) {
      case "banks":
        return await listBanks(cors);
      case "subaccount":
        return await createSubaccount(req, cors, payload);
      case "initialize":
        return await initialize(req, cors, payload);
      case "verify":
        return await verifyPayment(req, cors, payload);
      default:
        return json({ error: "Unknown action." }, cors, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error." }, cors, 500);
  }
});
