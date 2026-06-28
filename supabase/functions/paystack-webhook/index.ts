// Paystack webhook → marks an order paid reliably and idempotently.
// Security: verify the `x-paystack-signature` (HMAC-SHA512 of the raw body with the
// secret key), then re-verify the transaction with Paystack before trusting it.
// Deploy with "Verify JWT" OFF (Paystack does not send a Supabase JWT).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("TRANSACTIONAL_FROM_EMAIL") || "";
const APP_NAME = Deno.env.get("TRANSACTIONAL_APP_NAME") || "vengryd";
const SITE_URL = Deno.env.get("TRANSACTIONAL_SITE_URL") || "https://vengryd.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const isString = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const money = (amount: number | string) => `₦${Number(amount).toLocaleString("en-NG")}`;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendEmail(payload: { to: string | string[]; subject: string; text: string; html: string }) {
  if (!RESEND_API_KEY || !FROM_EMAIL) return;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, ...payload }),
  });
  if (!response.ok) console.error("Resend email failed", response.status, await response.text());
}

async function userEmail(supabase: ReturnType<typeof createClient>, userId: string | null | undefined) {
  if (!userId) return null;
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

async function sendOrderPaidEmails(supabase: ReturnType<typeof createClient>, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("id, buyer_id, total")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const { data: items } = await supabase
    .from("order_items")
    .select("name, unit_price, quantity, seller_id")
    .eq("order_id", orderId);
  const rows = (items ?? []) as { name: string; unit_price: number | string; quantity: number; seller_id: string | null }[];
  const itemText = rows.map((it) => `- ${it.name} x${it.quantity}: ${money(Number(it.unit_price) * it.quantity)}`).join("\n");
  const itemHtml = rows
    .map((it) => `<li>${escapeHtml(it.name)} x${it.quantity} — ${money(Number(it.unit_price) * it.quantity)}</li>`)
    .join("");

  const buyerEmail = await userEmail(supabase, order.buyer_id as string);
  if (buyerEmail) {
    await sendEmail({
      to: buyerEmail,
      subject: `Payment confirmed for order #${String(order.id).slice(0, 8)}`,
      text: `Thanks for your purchase on ${APP_NAME}.\n\nOrder: #${String(order.id).slice(0, 8)}\nTotal: ${money(order.total as string | number)}\n\n${itemText}\n\nView your orders: ${SITE_URL}/orders`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Thanks for your purchase on <strong>${escapeHtml(APP_NAME)}</strong>.</p>
          <p><strong>Order:</strong> #${String(order.id).slice(0, 8)}<br /><strong>Total:</strong> ${money(order.total as string | number)}</p>
          <ul>${itemHtml}</ul>
          <p><a href="${escapeHtml(SITE_URL)}/orders" style="color: #0f766e;">View your orders</a></p>
        </div>
      `,
    });
  }

  const sellerIds = [...new Set(rows.map((it) => it.seller_id).filter(isString))];
  const { data: vendors } = sellerIds.length
    ? await supabase.from("vendors").select("seller_id, name").in("seller_id", sellerIds)
    : { data: [] };
  const vendorName = new Map((vendors ?? []).map((v: { seller_id: string; name: string }) => [v.seller_id, v.name]));
  for (const sellerId of sellerIds) {
    const sellerEmail = await userEmail(supabase, sellerId);
    if (!sellerEmail) continue;
    const sellerItems = rows.filter((it) => it.seller_id === sellerId);
    const subtotal = sellerItems.reduce((sum, it) => sum + Number(it.unit_price) * it.quantity, 0);
    const sellerText = sellerItems.map((it) => `- ${it.name} x${it.quantity}: ${money(Number(it.unit_price) * it.quantity)}`).join("\n");
    const sellerHtml = sellerItems
      .map((it) => `<li>${escapeHtml(it.name)} x${it.quantity} — ${money(Number(it.unit_price) * it.quantity)}</li>`)
      .join("");
    await sendEmail({
      to: sellerEmail,
      subject: `New paid order for ${vendorName.get(sellerId) ?? APP_NAME}`,
      text: `You have a new paid order on ${APP_NAME}.\n\nOrder: #${String(order.id).slice(0, 8)}\nSubtotal: ${money(subtotal)}\n\n${sellerText}\n\nManage orders: ${SITE_URL}/seller?tab=orders`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>You have a new paid order on <strong>${escapeHtml(APP_NAME)}</strong>.</p>
          <p><strong>Order:</strong> #${String(order.id).slice(0, 8)}<br /><strong>Subtotal:</strong> ${money(subtotal)}</p>
          <ul>${sellerHtml}</ul>
          <p><a href="${escapeHtml(SITE_URL)}/seller?tab=orders" style="color: #0f766e;">Manage orders</a></p>
        </div>
      `,
    });
  }
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
    const { data: updated, error: upErr } = await supabase
      .from("orders")
      .update({ payment_status: "paid", flw_tx_id: String(tx.id ?? reference), paid_at: new Date().toISOString() })
      .eq("id", order.id)
      .neq("payment_status", "paid")
      .select("id");
    if (upErr) return json({ error: "Update failed" }, 500); // non-200 → Paystack retries
    if ((updated ?? []).length > 0) {
      await sendOrderPaidEmails(supabase, order.id).catch((error) => {
        console.error("Order paid email failed", error);
      });
    }
  }
  return json({ ok });
});
