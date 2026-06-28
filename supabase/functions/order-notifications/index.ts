// Authenticated order actions that need private email lookups.
// Currently handles seller fulfilment updates and emails the buyer.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("TRANSACTIONAL_FROM_EMAIL") || "";
const APP_NAME = Deno.env.get("TRANSACTIONAL_APP_NAME") || "vengryd";
const SITE_URL = Deno.env.get("TRANSACTIONAL_SITE_URL") || "https://vengryd.com";

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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function sendEmail(payload: { to: string; subject: string; text: string; html: string }) {
  if (!RESEND_API_KEY || !FROM_EMAIL) return;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, ...payload }),
  });
  if (!response.ok) console.error("Resend email failed", response.status, await response.text());
}

async function userFromRequest(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  if (!token) return null;
  const { data } = await createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE).auth.getUser(token);
  return data.user ?? null;
}

async function userEmail(supabase: ReturnType<typeof createClient>, userId: string | null | undefined) {
  if (!userId) return null;
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

type ItemWithOrder = {
  id: string;
  order_id: string;
  name: string;
  quantity: number;
  seller_id: string | null;
  fulfilled: boolean;
  orders: { buyer_id: string; payment_status: string | null } | null;
};

type ConversationRow = {
  id: string;
  buyer_id: string;
  seller_id: string;
  vendor_id: string;
};

async function profileName(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();
  const fullName = (data as { full_name?: string | null } | null)?.full_name;
  return fullName?.trim() || "Someone";
}

async function vendorName(supabase: ReturnType<typeof createClient>, vendorId: string) {
  const { data } = await supabase
    .from("vendors")
    .select("name")
    .eq("id", vendorId)
    .maybeSingle();
  return ((data as { name?: string | null } | null)?.name ?? APP_NAME).trim();
}

async function markFulfilled(
  req: Request,
  cors: Record<string, string>,
  payload: { itemId?: unknown; fulfilled?: unknown },
) {
  const user = await userFromRequest(req);
  if (!user) return json({ error: "Not authenticated." }, cors, 401);
  if (typeof payload.itemId !== "string" || typeof payload.fulfilled !== "boolean") {
    return json({ error: "Missing item or fulfilment state." }, cors, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: item, error: readError } = await supabase
    .from("order_items")
    .select("id, order_id, name, quantity, seller_id, fulfilled, orders(buyer_id, payment_status)")
    .eq("id", payload.itemId)
    .maybeSingle();
  if (readError) return json({ error: readError.message }, cors, 500);
  if (!item) return json({ error: "Order item not found." }, cors, 404);

  const row = item as unknown as ItemWithOrder;
  if (row.seller_id !== user.id) return json({ error: "Not your order item." }, cors, 403);
  if (row.orders?.payment_status !== "paid") return json({ error: "Only paid orders can be fulfilled." }, cors, 400);

  const changedToFulfilled = !row.fulfilled && payload.fulfilled;
  const { error: updateError } = await supabase
    .from("order_items")
    .update({ fulfilled: payload.fulfilled })
    .eq("id", row.id)
    .eq("seller_id", user.id);
  if (updateError) return json({ error: updateError.message }, cors, 500);

  if (changedToFulfilled) {
    const buyerEmail = await userEmail(supabase, row.orders?.buyer_id);
    if (buyerEmail) {
      await sendEmail({
        to: buyerEmail,
        subject: `Your ${APP_NAME} order item is fulfilled`,
        text: `${row.name} x${row.quantity} from order #${row.order_id.slice(0, 8)} has been marked fulfilled.\n\nView your order: ${SITE_URL}/orders`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p><strong>${escapeHtml(row.name)}</strong> x${row.quantity} from order #${row.order_id.slice(0, 8)} has been marked fulfilled.</p>
            <p><a href="${escapeHtml(SITE_URL)}/orders" style="color: #0f766e;">View your order</a></p>
          </div>
        `,
      }).catch((error) => {
        console.error("Fulfilment email failed", error);
      });
    }
  }

  return json({ ok: true }, cors);
}

async function sendMessage(
  req: Request,
  cors: Record<string, string>,
  payload: { conversationId?: unknown; body?: unknown },
) {
  const user = await userFromRequest(req);
  if (!user) return json({ error: "Not authenticated." }, cors, 401);
  if (typeof payload.conversationId !== "string" || typeof payload.body !== "string") {
    return json({ error: "Missing conversation or message." }, cors, 400);
  }

  const body = payload.body.trim();
  if (!body) return json({ error: "Message is empty." }, cors, 400);
  if (body.length > 4000) return json({ error: "Message is too long." }, cors, 400);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: conversation, error: readError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id, vendor_id")
    .eq("id", payload.conversationId)
    .maybeSingle();
  if (readError) return json({ error: readError.message }, cors, 500);
  if (!conversation) return json({ error: "Conversation not found." }, cors, 404);

  const row = conversation as ConversationRow;
  const isBuyer = row.buyer_id === user.id;
  const isSeller = row.seller_id === user.id;
  if (!isBuyer && !isSeller) return json({ error: "Not your conversation." }, cors, 403);

  const { data: message, error: insertError } = await supabase
    .from("messages")
    .insert({ conversation_id: row.id, sender_id: user.id, body })
    .select("id")
    .single();
  if (insertError) return json({ error: insertError.message }, cors, 500);

  const recipientId = isBuyer ? row.seller_id : row.buyer_id;
  const recipientEmail = await userEmail(supabase, recipientId);
  if (recipientEmail) {
    const senderName = isBuyer ? await profileName(supabase, user.id) : await vendorName(supabase, row.vendor_id);
    const threadUrl = isBuyer ? `${SITE_URL}/seller/messages?c=${row.id}` : `${SITE_URL}/messages?c=${row.id}`;
    const preview = body.length > 240 ? `${body.slice(0, 237)}...` : body;
    await sendEmail({
      to: recipientEmail,
      subject: `New message from ${senderName}`,
      text: `${senderName} sent you a message on ${APP_NAME}:\n\n${preview}\n\nReply here: ${threadUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p><strong>${escapeHtml(senderName)}</strong> sent you a message on ${escapeHtml(APP_NAME)}:</p>
          <blockquote style="border-left: 3px solid #0f766e; margin: 0; padding-left: 12px; color: #374151;">${escapeHtml(preview)}</blockquote>
          <p><a href="${escapeHtml(threadUrl)}" style="color: #0f766e;">Reply to message</a></p>
        </div>
      `,
    }).catch((error) => {
      console.error("Message email failed", error);
    });
  }

  return json({ ok: true, id: (message as { id: string }).id }, cors);
}

Deno.serve(async (req: Request) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, cors, 405);

  try {
    const payload = await req.json();
    if (payload.action === "mark-fulfilled") return await markFulfilled(req, cors, payload);
    if (payload.action === "send-message") return await sendMessage(req, cors, payload);
    return json({ error: "Unknown action." }, cors, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, cors, 500);
  }
});
