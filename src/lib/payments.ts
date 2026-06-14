import { getSupabaseClient } from "@/lib/supabase";

const FLW_SCRIPT = "https://checkout.flutterwave.com/v3.js";
const PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY as string | undefined;

export type SplitSubaccount = {
  id: string;
  /** Proportional ratio (we pass each vendor's subtotal). */
  transaction_split_ratio: number;
  transaction_charge_type: "percentage";
  transaction_charge: number;
};

type FlutterwaveResponse = { status?: string; transaction_id?: number; tx_ref?: string };

declare global {
  interface Window {
    FlutterwaveCheckout?: (config: Record<string, unknown>) => { close: () => void };
  }
}

export function isPaymentsConfigured() {
  return !!PUBLIC_KEY;
}

let scriptPromise: Promise<void> | null = null;
function loadFlutterwave(): Promise<void> {
  if (window.FlutterwaveCheckout) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = FLW_SCRIPT;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Could not load the payment library."));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

/**
 * Launch the Flutterwave modal. Resolves with the response on a completed
 * payment, or null if the buyer closed the modal without paying.
 */
export async function startPayment(args: {
  txRef: string;
  amount: number;
  email: string;
  name: string;
  subaccounts: SplitSubaccount[];
}): Promise<FlutterwaveResponse | null> {
  if (!PUBLIC_KEY) throw new Error("Payments are not configured.");
  await loadFlutterwave();

  return new Promise((resolve) => {
    let settled = false;
    const handler = window.FlutterwaveCheckout?.({
      public_key: PUBLIC_KEY,
      tx_ref: args.txRef,
      amount: args.amount,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd,account",
      customer: { email: args.email, name: args.name },
      subaccounts: args.subaccounts,
      customizations: { title: "vengryd", description: "Marketplace order" },
      callback: (response: FlutterwaveResponse) => {
        settled = true;
        handler?.close();
        resolve(response);
      },
      onclose: () => {
        if (!settled) resolve(null);
      },
    });
  });
}

/** Server-side verification + marks the order paid. */
export async function verifyPayment(orderId: string, transactionId: number | string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke("flutterwave", {
    body: { action: "verify", orderId, transactionId },
  });
  if (error) throw error;
  return !!(data as { paid?: boolean })?.paid;
}
