import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Store,
  ShoppingBag,
  MessageCircle,
  FileText,
  ShieldCheck,
  Mail,
  LogOut,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useCurrentUser, useSignOut, displayName, initials } from "@/lib/auth";
import { useMyProfile } from "@/lib/profile";

// Settings page (route: /settings) — account info, appearance, quick links, support, and account actions.

// A single tappable row inside a settings list (internal link or external href).
function SettingRow({
  icon: Icon,
  label,
  to,
  href,
}: {
  icon: typeof Store;
  label: string;
  to?: string;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  const cls =
    "flex items-center justify-between px-5 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50";
  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link to={to ?? "#"} className={cls}>
      {inner}
    </Link>
  );
}

// Section card wrapper with an uppercase label above it.
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</h2>
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-card">{children}</div>
    </section>
  );
}

/**
 * Settings page: shows the signed-in account, the light/dark appearance toggle
 * (persisted per device via next-themes), quick links to orders/messages/selling,
 * support + legal links, and account actions (sign out, delete account placeholder).
 */
const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { data: user } = useCurrentUser();
  const { data: profile } = useMyProfile();
  const signOut = useSignOut();

  const name = profile?.fullName?.trim() || displayName(user);
  const username = profile?.username ?? (user?.user_metadata?.username as string | undefined) ?? undefined;
  const role = profile?.role ?? "buyer";

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="font-display text-2xl font-black tracking-tight text-foreground">
            ven<span className="text-primary">gryd</span>
          </Link>
          <Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">
            Marketplace
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-black uppercase tracking-tighter">Settings</h1>

        {/* Account */}
        <Group label="Account">
          {user ? (
            <div className="flex items-center gap-4 p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {initials(name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg font-bold text-foreground">{name}</p>
                {username ? <p className="truncate text-sm text-muted-foreground">@{username}</p> : null}
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {role}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-5">
              <p className="text-sm text-muted-foreground">You're not signed in.</p>
              <Link
                to="/auth"
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground hover:bg-primary/90"
              >
                Sign in
              </Link>
            </div>
          )}
        </Group>

        {/* Appearance */}
        <Group label="Appearance">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">How vengryd looks on this device.</p>
            </div>
            <div className="inline-flex rounded-full border-2 border-border p-1">
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
          </div>
        </Group>

        {/* Activity */}
        <Group label="Your activity">
          <div className="divide-y divide-border">
            <SettingRow icon={ShoppingBag} label="My orders" to="/orders" />
            <SettingRow icon={MessageCircle} label="Messages" to="/messages" />
            <SettingRow icon={Store} label="Sell on vengryd" to="/seller" />
          </div>
        </Group>

        {/* Support & legal */}
        <Group label="Support & legal">
          <div className="divide-y divide-border">
            <SettingRow icon={Mail} label="Contact support" href="mailto:vengrydmarketplace@gmail.com" />
            <SettingRow icon={FileText} label="Terms of Service" to="/terms" />
            <SettingRow icon={ShieldCheck} label="Privacy Policy" to="/privacy" />
          </div>
        </Group>

        {/* Account actions */}
        {user ? (
          <Group label="Account actions">
            <div className="divide-y divide-border">
              <button
                type="button"
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4 text-primary" /> {signOut.isPending ? "Signing out…" : "Sign out"}
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="flex w-full cursor-not-allowed items-center gap-3 px-5 py-3.5 text-left text-sm font-medium text-destructive opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Delete account
                <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              </button>
            </div>
          </Group>
        ) : null}

        <Link
          to="/"
          className="mt-8 inline-flex rounded-xl border-2 border-border px-6 py-3 text-sm font-display font-semibold uppercase tracking-tight text-foreground transition-colors hover:border-primary/50"
        >
          Back to website
        </Link>

        <p className="mt-8 text-center text-xs text-muted-foreground">vengryd · Be part of something local.</p>
      </main>
    </div>
  );
};

export default Settings;
