// Flutterwave webhook → marks an order paid reliably and idempotently.
// Security: the `verif-hash` header must equal FLW_WEBHOOK_HASH, AND we re-verify
// the transaction against Flutterwave's API before trusting it. Deploy this function
// with "Verify JWT" OFF (Flutterwave does not send a Supabase JWT).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const FLW_SECRET = Deno.env.get("FLW_SECRET_KEY") ?? "";
const WEBHOOK_HASH = Deno.env.get("FLW_WEBHOOK_HASH") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // 1) Verify the webhook signature.
  const signature = req.headers.get("verif-hash");
  if (!WEBHOOK_HASH || signature !== WEBHOOK_HASH) return json({ error: "Unauthorized" }, 401);

  let payload: { data?: { id?: number | string; tx_ref?: string } };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Bad payload" }, 400);
  }

  const txId = payload.data?.id;
  const txRef = payload.data?.tx_ref;
  if (!txId || !txRef) return json({ ignored: true });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  const { data: order } = await supabase
    .from("orders")
    .select("id, total, payment_status")
    .eq("id", txRef)
    .maybeSingle();
  if (!order) return json({ ignored: true });
  if (order.payment_status === "paid") return json({ ok: true }); // idempotent

  // 2) Don't trust the webhook body — re-verify the transaction with Flutterwave.
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${txId}/verify`, {
    headers: { Authorization: `Bearer ${FLW_SECRET}` },
  });
  const v = await res.json();
  const tx = v.data;
  const ok =
    v.status === "success" &&
    tx?.status === "successful" &&
    tx?.currency === "NGN" &&
    tx?.tx_ref === order.id &&
    Number(tx?.amount) >= Number(order.total);

  if (ok) {
    await supabase
      .from("orders")
      .update({ payment_status: "paid", flw_tx_id: String(txId), paid_at: new Date().toISOString() })
      .eq("id", order.id);
  }
  return json({ ok });
});
