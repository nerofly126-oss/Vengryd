import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const Settings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter">Settings</h1>

        <section className="mt-8 rounded-2xl border-2 border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Appearance</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose how vengryd looks on this device.</p>

          <div className="mt-4 inline-flex rounded-full border-2 border-border p-1">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-display font-semibold transition-colors ${
                theme === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4" /> Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-display font-semibold transition-colors ${
                theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4" /> Dark
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
