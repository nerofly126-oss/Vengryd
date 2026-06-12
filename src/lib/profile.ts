import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

export type AppRole = "buyer" | "seller";

export function getRoleFromUser(user: User | null | undefined): AppRole {
  const role = user?.user_metadata?.role ?? user?.app_metadata?.role;
  return role === "seller" ? "seller" : "buyer";
}

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
