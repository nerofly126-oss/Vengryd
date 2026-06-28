// Profile helpers: derive role/name from a Supabase user and best-effort client-side profile row creation.
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type AppRole = "buyer" | "seller";
export type Profile = {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  username: string | null;
  role: AppRole;
};

/** Reads the user's role from user/app metadata, defaulting to "buyer". */
export function getRoleFromUser(user: User | null | undefined): AppRole {
  const role = user?.user_metadata?.role ?? user?.app_metadata?.role;
  return role === "seller" ? "seller" : "buyer";
}

/** The user's full_name metadata, falling back to the email local-part or a generic label. */
export function getFullName(user: User) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  return user.email?.split("@")[0] ?? "Marketplace User";
}

/**
 * Best-effort client fallback for profile creation. The DB trigger
 * (handle_new_user) is the source of truth; this must never block auth and never
 * clobber user-edited fields (ignoreDuplicates => insert-if-missing).
 */
export async function ensureProfile(user: User) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        role: getRoleFromUser(user),
        full_name: getFullName(user),
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  } catch {
    /* ignore — profile creation is handled server-side */
  }
}

/** The signed-in user's database profile. `profiles.role` is the source of truth. */
export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async (): Promise<Profile | null> => {
      if (!isSupabaseConfigured()) return null;
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, username, role")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id as string,
        fullName: (data.full_name as string | null) ?? null,
        avatarUrl: (data.avatar_url as string | null) ?? null,
        username: (data.username as string | null) ?? null,
        role: data.role === "seller" ? "seller" : "buyer",
      };
    },
    initialData: null,
  });
}
