// Client-side payment helpers: launches the Paystack inline checkout (with a
// multi-vendor split) and verifies the charge server-side via the `paystack` edge function.
import { getSupabaseClient } from "@/lib/supabase";

const PAYSTACK_SCRIPT = "https://js.paystack.co/v2/inline.js";
const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;

/** One vendor's slice of a split — `share` is the amount that vendor receives, in kobo. */
export type SplitSubaccount = {
  subaccount: string;
  share: number;
};

type PaystackResponse = { reference?: string; status?: string };

declare global {
  interface Window {
    PaystackPop?: new () => {
      newTransaction: (opts: Record<string, unknown>) => void;
    };
  }
}

/** True when the Paystack public key is configured. */
export function isPaymentsConfigured() {
  return !!PUBLIC_KEY;
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
 * Launch the Paystack modal. Resolves with the response on a completed payment, or
 * null if the buyer closed the modal. `amount` is in kobo; `subaccounts` is a flat
 * split so each vendor is paid their share and the platform keeps the remainder.
 */
export async function startPayment(args: {
  reference: string;
  amount: number; // kobo
  email: string;
  subaccounts: SplitSubaccount[];
}): Promise<PaystackResponse | null> {
  if (!PUBLIC_KEY) throw new Error("Payments are not configured.");
  await loadPaystack();

  return new Promise((resolve) => {
    let settled = false;
    const popup = new window.PaystackPop!();
    popup.newTransaction({
      key: PUBLIC_KEY,
      email: args.email,
      amount: args.amount,
      reference: args.reference,
      currency: "NGN",
      // Offer all common Nigerian channels (each only shows if enabled on the Paystack account).
      channels: ["card", "bank_transfer", "ussd", "bank", "qr", "mobile_money"],
      split: {
        type: "flat",
        bearer_type: "all-proportional",
        subaccounts: args.subaccounts,
      },
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
