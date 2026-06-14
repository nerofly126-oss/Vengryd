// Flutterwave server-side endpoint for vengryd.
// Actions (POST JSON { action, ... }):
//   - "banks"      -> list Nigerian banks (for payout setup)
//   - "subaccount" -> create/refresh a vendor's payout subaccount (auth required)
//   - "verify"     -> verify a charge and mark the order paid
//
// Secrets required: FLW_SECRET_KEY (set via `supabase secrets set`).
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FLW_SECRET = Deno.env.get("FLW_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PLATFORM_COMMISSION = 0.1; // 10% to the platform, 90% to the vendor.

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function flwHeaders() {
  return { Authorization: `Bearer ${FLW_SECRET}`, "Content-Type": "application/json" };
}

const admin = () => createClient(SUPABASE_URL, SERVICE_ROLE);

async function listBanks() {
  const res = await fetch("https://api.flutterwave.com/v3/banks/NG", { headers: flwHeaders() });
  const body = await res.json();
  if (body.status !== "success") return json({ error: body.message ?? "Could not load banks." }, 502);
  const banks = (body.data ?? []).map((b: { code: string; name: string }) => ({ code: b.code, name: b.name }));
  return json({ banks });
}

async function userFromRequest(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
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

  const res = await fetch("https://api.flutterwave.com/v3/subaccounts", {
    method: "POST",
    headers: flwHeaders(),
    body: JSON.stringify({
      account_bank: bankCode,
      account_number: accountNumber,
      business_name: vendor.name,
      business_email: user.email,
      business_mobile: user.phone ?? "",
      country: "NG",
      split_type: "percentage",
      split_value: PLATFORM_COMMISSION,
    }),
  });
  const body = await res.json();
  if (body.status !== "success") return json({ error: body.message ?? "Could not verify that account." }, 400);

  const subaccountId: string = body.data.subaccount_id;
  const accountName: string = body.data.account_name ?? body.data.full_name ?? null;

  const { error: upErr } = await supabase.from("vendor_payouts").upsert({
    vendor_id: vendor.id,
    seller_id: user.id,
    bank_code: bankCode,
    account_number: accountNumber,
    account_name: accountName,
    flw_subaccount_id: subaccountId,
    updated_at: new Date().toISOString(),
  });
  if (upErr) return json({ error: upErr.message }, 500);

  const { error: vUpErr } = await supabase
    .from("vendors")
    .update({ flw_subaccount_id: subaccountId })
    .eq("id", vendor.id);
  if (vUpErr) return json({ error: vUpErr.message }, 500);

  return json({ ok: true, accountName, subaccountId });
}

async function verifyPayment(payload: { orderId?: string; transactionId?: string | number }) {
  const { orderId, transactionId } = payload;
  if (!orderId || !transactionId) return json({ error: "Missing order or transaction." }, 400);

  const supabase = admin();
  const { data: order, error: oErr } = await supabase
    .from("orders")
    .select("id, total, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr) return json({ error: oErr.message }, 500);
  if (!order) return json({ error: "Order not found." }, 404);
  if (order.payment_status === "paid") return json({ paid: true });

  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: flwHeaders(),
  });
  const body = await res.json();
  const tx = body.data;
  const ok =
    body.status === "success" &&
    tx?.status === "successful" &&
    tx?.currency === "NGN" &&
    tx?.tx_ref === orderId &&
    Number(tx?.amount) >= Number(order.total);

  if (!ok) {
    await supabase.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
    return json({ paid: false, error: "Payment could not be verified." }, 400);
  }

  const { error: upErr } = await supabase
    .from("orders")
    .update({ payment_status: "paid", flw_tx_id: String(transactionId), paid_at: new Date().toISOString() })
    .eq("id", orderId);
  if (upErr) return json({ error: upErr.message }, 500);

  return json({ paid: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!FLW_SECRET) return json({ error: "Flutterwave is not configured." }, 500);

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
