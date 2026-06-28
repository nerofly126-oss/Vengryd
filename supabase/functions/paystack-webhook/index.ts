// Paystack webhook → marks an order paid reliably and idempotently.
// Security: verify the `x-paystack-signature` (HMAC-SHA512 of the raw body with the
// secret key), then re-verify the transaction with Paystack before trusting it.
// Deploy with "Verify JWT" OFF (Paystack does not send a Supabase JWT).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// HMAC-SHA512(secret, body) as lowercase hex — matches Paystack's x-paystack-signature.
async function sign(body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time string comparison to avoid leaking the signature via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!PAYSTACK_SECRET || !signature || !timingSafeEqual(signature, await sign(raw))) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(raw);
  } catch {
    return json({ error: "Bad payload" }, 400);
  }
  if (payload.event !== "charge.success") return json({ ignored: true });

  const reference = payload.data?.reference;
  if (!reference) return json({ ignored: true });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: order, error: readErr } = await supabase
    .from("orders")
    .select("id, total, payment_status")
    .eq("id", reference)
    .maybeSingle();
  if (readErr) return json({ error: "Lookup failed" }, 500); // non-200 → Paystack retries
  if (!order) return json({ ignored: true });
  if (order.payment_status === "paid") return json({ ok: true }); // idempotent

  // Re-verify with Paystack rather than trusting the webhook body.
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const body = await res.json();
  const tx = body.data;
  const ok =
    body.status === true &&
    tx?.status === "success" &&
    tx?.currency === "NGN" &&
    tx?.reference === order.id &&
    Number(tx?.amount) >= Math.round(Number(order.total) * 100);

  if (ok) {
    // Conditional update = atomic idempotency: only the first delivery flips it to paid.
    const { error: upErr } = await supabase
      .from("orders")
      .update({ payment_status: "paid", flw_tx_id: String(tx.id ?? reference), paid_at: new Date().toISOString() })
      .eq("id", order.id)
      .neq("payment_status", "paid");
    if (upErr) return json({ error: "Update failed" }, 500); // non-200 → Paystack retries
  }
  return json({ ok });
});
