const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type WaitlistPayload = {
  email?: string;
  source?: string;
};

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = Deno.env.get("WAITLIST_FROM_EMAIL");
const adminEmail = Deno.env.get("WAITLIST_ADMIN_EMAIL");
const appName = Deno.env.get("WAITLIST_APP_NAME") || "vengryd";
const siteUrl = Deno.env.get("WAITLIST_SITE_URL") || "https://vengryd.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
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

async function sendEmail(payload: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY secret.");
  }

  if (!fromEmail) {
    throw new Error("Missing WAITLIST_FROM_EMAIL secret.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      ...payload,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${errorText}`);
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  try {
    const { email, source }: WaitlistPayload = await request.json();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return json({ error: "Email is required." }, 400);
    }

    const safeEmail = escapeHtml(normalizedEmail);
    const safeSource = escapeHtml(source || "website_waitlist");
    const safeAppName = escapeHtml(appName);
    const safeSiteUrl = escapeHtml(siteUrl);

    await sendEmail({
      to: normalizedEmail,
      subject: `You're on the ${appName} waitlist`,
      text:
        `Thanks for joining the ${appName} waitlist.\n\n` +
        `We will let you know when we launch.\n\n` +
        `Visit us: ${siteUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <p>Hi there,</p>
          <p>Thanks for joining the <strong>${safeAppName}</strong> waitlist.</p>
          <p>We will let you know as soon as we launch.</p>
          <p>
            In the meantime, you can visit
            <a href="${safeSiteUrl}" style="color: #0f766e;">${safeSiteUrl}</a>.
          </p>
          <p>Talk soon,<br />The ${safeAppName} team</p>
        </div>
      `,
    });

    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New ${appName} waitlist signup`,
        text:
          `A new waitlist signup was received.\n\n` +
          `Email: ${normalizedEmail}\n` +
          `Source: ${source || "website_waitlist"}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
            <p>A new waitlist signup was received.</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Source:</strong> ${safeSource}</p>
          </div>
        `,
      });
    }

    return json({ ok: true });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : "Unable to send waitlist email.",
      },
      500,
    );
  }
});
