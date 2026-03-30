import { Sparkles } from "lucide-react";
import { LumaSpin } from "@/components/ui/luma-spin";

const LoadingScreen = () => {
  return (
    <div className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-screen__backdrop" />
      <div className="loading-screen__content">
        <div className="loading-screen__spinner-wrap">
          <LumaSpin className="loading-screen__spinner" />
          <span className="loading-screen__icon-shell">
            <Sparkles className="h-4 w-4 text-earth-light" />
          </span>
        </div>
        <p className="loading-screen__eyebrow">Vengryd</p>
        <h1 className="loading-screen__title">Preparing your marketplace</h1>
        <p className="loading-screen__subtitle">Curating artisan finds, buyer updates, and fresh arrivals.</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
