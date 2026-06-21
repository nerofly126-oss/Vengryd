// Link sharing helper: uses the Web Share API when available, otherwise copies to clipboard with a toast.
import { toast } from "sonner";

/** Share a path within the app — uses the native share sheet when available, else copies the link. */
export async function shareLink(path: string, title: string) {
  const url = `${window.location.origin}${path}`;
  const nav = navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title, url });
      return;
    } catch {
      // user cancelled the share sheet — fall through to copy
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Profile link copied to clipboard");
  } catch {
    toast.error("Couldn't copy the link");
  }
}
