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

export function displayName(user: User | null): string {
  if (!user) return "";
  const name = user.user_metadata?.full_name;
  if (typeof name === "string" && name.trim()) return name.trim();
  return user.email?.split("@")[0] ?? "Account";
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "U";
}

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
