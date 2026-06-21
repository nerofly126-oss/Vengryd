// Seller payout setup: hooks to list banks, read saved payout details, and create a Paystack subaccount — all via the "paystack" edge function.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type Bank = { code: string; name: string };

export type MyPayout = {
  bankCode: string;
  accountNumber: string;
  accountName: string | null;
  subaccountId: string | null;
} | null;

/** Nigerian bank list (proxied through the edge function, which holds the secret key). */
export function useBanks(enabled: boolean) {
  return useQuery({
    queryKey: ["paystack-banks"],
    enabled: enabled && isSupabaseConfigured(),
    staleTime: 1000 * 60 * 60,
    queryFn: async (): Promise<Bank[]> => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke("paystack", { body: { action: "banks" } });
      if (error) throw error;
      return ((data as { banks?: Bank[] })?.banks ?? []).sort((a, b) => a.name.localeCompare(b.name));
    },
  });
}

/** The current seller's saved payout details (owner-only row). */
export function useMyPayout() {
  return useQuery({
    queryKey: ["my-payout"],
    queryFn: async (): Promise<MyPayout> => {
      if (!isSupabaseConfigured()) return null;
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("vendor_payouts")
        .select("bank_code, account_number, account_name, flw_subaccount_id")
        .eq("seller_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        bankCode: data.bank_code,
        accountNumber: data.account_number,
        accountName: data.account_name,
        subaccountId: data.flw_subaccount_id,
      };
    },
    initialData: null,
  });
}

/** Creates/updates the seller's Paystack subaccount from bank + account number via the edge function; invalidates payout and vendor caches. */
export function useSavePayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bankCode, accountNumber }: { bankCode: string; accountNumber: string }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.functions.invoke("paystack", {
        body: { action: "subaccount", bankCode, accountNumber },
      });
      if (error) throw error;
      const res = data as { ok?: boolean; error?: string; accountName?: string };
      if (!res?.ok) throw new Error(res?.error ?? "Could not save payout details.");
      return res;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-payout"] });
      void qc.invalidateQueries({ queryKey: ["catalog-vendors"] });
      void qc.invalidateQueries({ queryKey: ["my-vendor"] });
    },
  });
}
