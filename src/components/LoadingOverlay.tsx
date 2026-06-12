import { LumaSpin } from "@/components/ui/luma-spin";

/** Full-screen loading overlay: LumaSpin animation over a blurred backdrop. */
export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/50 backdrop-blur-xl">
      <LumaSpin className="scale-[1.6] [filter:drop-shadow(0_0_18px_hsl(var(--primary)/0.4))]" />
    </div>
  );
}

export default LoadingOverlay;
