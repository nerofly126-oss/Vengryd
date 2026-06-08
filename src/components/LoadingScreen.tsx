import { LumaSpin } from "@/components/ui/luma-spin";

const LoadingScreen = () => {
  return (
    <div className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-screen__backdrop" />
      <LumaSpin className="loading-screen__spinner scale-[2.4]" />
    </div>
  );
};

export default LoadingScreen;
