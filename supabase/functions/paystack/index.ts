// Paystack server-side endpoint for vengryd.
// Actions (POST JSON { action, ... }):
//   - "banks"      -> list Nigerian banks (for payout setup)
//   - "subaccount" -> resolve the account name + create/refresh a vendor payout subaccount (auth required)
//   - "verify"     -> verify a charge by reference and mark the order paid
//
// Secret required: PAYSTACK_SECRET_KEY (set via `supabase secrets set`).
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PLATFORM_COMMISSION = 10; // percent kept by the platform

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function psHeaders() {
  return { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" };
}

const admin = () => createClient(SUPABASE_URL, SERVICE_ROLE);

async function listBanks() {
  const res = await fetch("https://api.paystack.co/bank?currency=NGN&country=nigeria", { headers: psHeaders() });
  const body = await res.json();
  if (!body.status) return json({ error: body.message ?? "Could not load banks." }, 502);
  const banks = ((body.data ?? []) as { code: string; name: string }[]).map((b) => ({ code: b.code, name: b.name }));
  return json({ banks });
}

async function userFromRequest(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) return null;
  const { data } = await createClient(SUPABASE_URL, SERVICE_ROLE).auth.getUser(token);
  return data.user ?? null;
}

async function createSubaccount(req: Request, payload: { bankCode?: string; accountNumber?: string }) {
  const user = await userFromRequest(req);
  if (!user) return json({ error: "Not authenticated." }, 401);
  const { bankCode, accountNumber } = payload;
  if (!bankCode || !accountNumber) return json({ error: "Bank and account number are required." }, 400);

  const supabase = admin();
  const { data: vendor, error: vErr } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("seller_id", user.id)
    .maybeSingle();
  if (vErr) return json({ error: vErr.message }, 500);
  if (!vendor) return json({ error: "Set up your vendor profile before adding payout details." }, 400);

  // Confirm the account first (Paystack returns the real account holder name).
  const resolveRes = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { headers: psHeaders() },
  );
  const resolve = await resolveRes.json();
  if (!resolve.status) return json({ error: resolve.message ?? "Couldn't verify that account number." }, 400);
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
  if (!body.status) return json({ error: body.message ?? "Could not create payout account." }, 400);

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
  if (upErr) return json({ error: upErr.message }, 500);

  const { error: vUpErr } = await supabase
    .from("vendors")
    .update({ flw_subaccount_id: subaccountCode })
    .eq("id", vendor.id);
  if (vUpErr) return json({ error: vUpErr.message }, 500);

  return json({ ok: true, accountName, subaccountId: subaccountCode });
}

async function verifyPayment(payload: { orderId?: string; reference?: string }) {
  const { orderId, reference } = payload;
  if (!orderId || !reference) return json({ error: "Missing order or reference." }, 400);

  const supabase = admin();
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id, total, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr) return json({ error: oErr.message }, 500);
  if (!order) return json({ error: "Order not found." }, 404);
  if (order.payment_status === "paid") return json({ paid: true });

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: psHeaders(),
  });
  const body = await res.json();
  const tx = body.data;
  const ok =
    body.status === true &&
    tx?.status === "success" &&
    tx?.currency === "NGN" &&
    tx?.reference === order.id &&
    Number(tx?.amount) >= Math.round(Number(order.total) * 100); // Paystack amounts are in kobo

  if (!ok) {
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
    return json({ paid: false, error: "Payment could not be verified." }, 400);
  }

  await supabase
    .from("orders")
    .update({ payment_status: "paid", flw_tx_id: String(tx.id ?? reference), paid_at: new Date().toISOString() })
    .eq("id", orderId);
  return json({ paid: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!PAYSTACK_SECRET) return json({ error: "Paystack is not configured." }, 500);

  try {
    const payload = await req.json();
    switch (payload.action) {
      case "banks":
        return await listBanks();
      case "subaccount":
        return await createSubaccount(req, payload);
      case "verify":
        return await verifyPayment(payload);
      default:
        return json({ error: "Unknown action." }, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error." }, 500);
  }
});
