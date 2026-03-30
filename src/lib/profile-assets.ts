import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

export type ProfileAssetKind = "avatar" | "logo";

const PROFILE_ASSETS_BUCKET =
  import.meta.env.VITE_SUPABASE_PROFILE_ASSETS_BUCKET || "profile-assets";

function getFileExtension(file: File) {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "png" : "png";
}

export function getProfileAssetsBucket() {
  return PROFILE_ASSETS_BUCKET;
}

export async function uploadProfileAsset(user: User, file: File, kind: ProfileAssetKind) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Images must be 5MB or smaller.");
  }

  const supabase = getSupabaseClient();
  const extension = getFileExtension(file);
  const filePath = `${user.id}/${kind}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_ASSETS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_ASSETS_BUCKET).getPublicUrl(filePath);

  const column = kind === "logo" ? "logo_url" : "avatar_url";
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ [column]: publicUrl })
    .eq("id", user.id);

  if (profileError) {
    throw profileError;
  }

  return publicUrl;
}
