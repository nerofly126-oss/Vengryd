// Auth helpers: React Query hooks for the current Supabase user / sign-out, plus name formatting utils.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

/** The current signed-in user (null when Supabase isn't configured or nobody is signed in). */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<User | null> => {
      if (!isSupabaseConfigured()) return null;
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
    initialData: null,
  });
}

/** Human-friendly name for a user: full_name metadata, else the email local-part, else "Account". */
export function displayName(user: User | null): string {
  if (!user) return "";
  const name = user.user_metadata?.full_name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "Account";
}

/** Up to two uppercase initials from a name (falls back to "U" when empty). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "U";
}

/** Mutation that signs the user out of Supabase and invalidates all cached queries. */
export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (isSupabaseConfigured()) await getSupabaseClient().auth.signOut();
    },
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
}
