import type { User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type AppRole = "buyer" | "seller";

export function getRoleFromUser(user: User | null | undefined): AppRole {
  const role = user?.user_metadata?.role ?? user?.app_metadata?.role;
  return role === "seller" ? "seller" : "buyer";
}

export function getDashboardPath(role: AppRole) {
  return role === "seller" ? "/seller/dashboard" : "/buyer/dashboard";
}

export function getFullName(user: User) {
  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  return user.email?.split("@")[0] ?? "Marketplace User";
}

export function getBusinessName(user: User) {
  const businessName = user.user_metadata?.business_name;
  if (typeof businessName === "string" && businessName.trim()) return businessName.trim();
  return `${getFullName(user)} Studio`;
}

export function getUsername(user: User) {
  const username = user.user_metadata?.username;
  if (typeof username === "string" && username.trim()) return username.trim();
  return user.email?.split("@")[0] ?? null;
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
}

export async function ensureProfile(user: User) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      role: getRoleFromUser(user),
      full_name: getFullName(user),
      username: getUsername(user),
      location: "Lagos",
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }
}

export async function getCurrentUserRole() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return (profile?.role as AppRole | undefined) ?? getRoleFromUser(user);
}

export async function getRoleForUser(user: User) {
  const supabase = getSupabaseClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (profile?.role as AppRole | undefined) ?? getRoleFromUser(user);
}
