// Client-side payment helpers. The order total and the multi-vendor split are
// computed server-side (the `paystack` edge function's "initialize" action) from
// the persisted order_items, so the client never decides amounts or payout routing.
// Here we just resume the returned transaction and verify it afterwards.
import { getSupabaseClient } from "@/lib/supabase";

const PAYSTACK_SCRIPT = "https://js.paystack.co/v2/inline.js";

type PaystackResponse = { reference?: string; status?: string };

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (accessCode: string, callbacks?: Record<string, unknown>) => void;
    };
  }
}

// Optional client flag for whether payments are enabled. The real config (secret
// key, subaccounts) lives server-side; default to enabled when the flag is unset.
const PAYMENTS_FLAG = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

/** True when payments are enabled for this deployment. */
export function isPaymentsConfigured() {
  return PAYMENTS_FLAG !== "off";
}

let scriptPromise: Promise<void> | null = null;
// Lazily injects the Paystack inline script once.
function loadPaystack(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = PAYSTACK_SCRIPT;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Could not load the payment library."));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

/**
 * Ask the server to create the charge for an order. The edge function computes the
 * authoritative total + per-vendor split from the persisted order_items and returns
 * a Paystack access code (the client never supplies amounts or subaccounts).
 */
export async function initializePayment(orderId: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("paystack", {
    body: { action: "initialize", orderId },
  });
  if (error) throw error;
  const result = data as { accessCode?: string; error?: string };
  if (result?.error) throw new Error(result.error);
  if (!result?.accessCode) throw new Error("Could not start payment.");
  return result.accessCode;
}

/**
 * Resume a server-initialized Paystack transaction in the inline modal. Resolves
 * with the response on a completed payment, or null if the buyer closed the modal.
 */
export async function resumePayment(accessCode: string): Promise<PaystackResponse | null> {
  await loadPaystack();

  return new Promise((resolve) => {
    let settled = false;
    const popup = new window.PaystackPop!();
    popup.resumeTransaction(accessCode, {
      onSuccess: (transaction: PaystackResponse) => {
        settled = true;
        resolve(transaction);
      },
      onCancel: () => {
        if (!settled) resolve(null);
      },
    });
  });
}

/** Server-side verification (re-checks the charge with Paystack) + marks the order paid. */
export async function verifyPayment(orderId: string, reference: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("paystack", {
    body: { action: "verify", orderId, reference },
  });
  if (error) throw error;
  return !!(data as { paid?: boolean })?.paid;
}
