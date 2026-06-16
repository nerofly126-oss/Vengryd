import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, AtSign, Mail, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LeafCorners from "@/components/Leafcorners";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { ensureProfile } from "@/lib/profile";

type AuthMode = "login" | "signup" | "reset";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryMode = searchParams.get("mode");
  const authError = searchParams.get("error_description") || searchParams.get("error");
  const authConfigured = isSupabaseConfigured();
  const [mode, setMode] = useState<AuthMode>(queryMode === "reset" ? "reset" : "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "invalid" | "checking" | "available" | "taken">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const signInWithGoogle = async () => {
    if (!authConfigured) {
      setErrorMessage("Authentication is not configured.");
      return;
    }
    setErrorMessage("");
    setOauthLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/marketplace` },
      });
      // On success the browser redirects to Google, so we only handle errors here.
      if (error) {
        setErrorMessage(error.message);
        setOauthLoading(false);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not start Google sign-in.");
      setOauthLoading(false);
    }
  };
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
    }
  }, [authError]);

  useEffect(() => {
    if (queryMode === "reset") {
      setMode("reset");
      setSuccessMessage("Enter a new password to finish recovering your account.");
    }
  }, [queryMode]);

  // Live username availability check (signup only).
  useEffect(() => {
    if (mode !== "signup") return;
    const u = form.username.trim().toLowerCase();
    if (!u) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const timer = window.setTimeout(async () => {
      if (!isSupabaseConfigured()) {
        setUsernameStatus("idle");
        return;
      }
      const { data } = await getSupabaseClient()
        .from("profiles")
        .select("id")
        .ilike("username", u)
        .limit(1)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [form.username, mode]);

  useEffect(() => {
    if (!authConfigured) {
      return;
    }

    let isMounted = true;
    const supabase = getSupabaseClient();

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted && session) {
          await ensureProfile(session.user);

          if (mode === "reset") {
            setSuccessMessage("Enter a new password to finish recovering your account.");
            return;
          }
          navigate("/marketplace", { replace: true });
          return;
        }

      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to verify your session.");
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMode("reset");
        setErrorMessage("");
        setSuccessMessage("Enter a new password to finish recovering your account.");
        return;
      }

      if (session) {
        if (mode === "reset") {
          return;
        }

        void (async () => {
          await ensureProfile(session.user);
          navigate("/marketplace", { replace: true });
        })();
      }
    });

    void checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [authConfigured, mode, navigate]);

  const roleHeading =
    mode === "reset"
      ? "Reset your password"
      : mode === "login"
      ? "Welcome back"
      : "Create your account";
  const roleSubcopy =
    mode === "reset"
      ? "Choose a new password for your account."
      : mode === "login"
      ? "Log in to your vengryd account."
      : "Join vengryd to start trading locally.";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const getAuthClient = () => {
    if (!authConfigured) {
      throw new Error("Authentication is not configured yet. Add your Supabase env vars to enable sign in.");
    }

    return getSupabaseClient();
  };

  const setVisibleMode = (nextMode: Exclude<AuthMode, "reset">) => {
    resetMessages();
    setMode(nextMode);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    const normalizedEmail = form.email.trim().toLowerCase();
    const password = form.password.trim();

    if (mode === "signup" && (usernameStatus === "taken" || usernameStatus === "invalid")) {
      setIsSubmitting(false);
      setErrorMessage(
        usernameStatus === "taken" ? "That username is taken — pick another." : "Please choose a valid username.",
      );
      return;
    }

    try {
      const supabase = getAuthClient();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              full_name: form.fullName.trim(),
              username: form.username.trim().toLowerCase(),
              role: "buyer",
            },
          },
        });

        if (error) {
          if (/already\s*registered|already\s*exists|user_already_exists/i.test(error.message)) {
            setMode("login");
            setErrorMessage("This email already has an account — please log in.");
            return;
          }
          throw error;
        }

        // With email confirmation on, Supabase returns a user with no identities
        // for an already-registered email (anti-enumeration) instead of an error.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          setMode("login");
          setErrorMessage("This email already has an account — please log in.");
          return;
        }

        if (data.user && data.session) {
          await ensureProfile(data.user);
          navigate("/marketplace", { replace: true });
          return;
        }

        setSuccessMessage("Check your email to confirm your account.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          throw error;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await ensureProfile(user);
        }

        navigate("/marketplace", { replace: true });
      } else {
        const { data, error } = await supabase.auth.updateUser({
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          await ensureProfile(data.user);
        }

        navigate("/marketplace", { replace: true });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to complete authentication.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    resetMessages();

    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Enter your email address first, then try resetting your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getAuthClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Password reset instructions have been sent to your email.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send reset instructions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      <LeafCorners />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Bugatti horseshoe emblem outline, centred behind the card */}
        <svg
          className="absolute left-1/2 top-1/2 h-[82vh] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.07]"
          viewBox="0 0 200 280"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M100 6C42 6 20 58 20 140s35 134 80 134 80-52 80-134S158 6 100 6Z"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
          <path
            d="M100 30C58 30 40 74 40 140s28 120 60 120 60-54 60-120S142 30 100 30Z"
            stroke="hsl(var(--foreground))"
            strokeWidth="0.6"
          />
        </svg>

        {/* ligne de cœur — central spine */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/25 to-transparent" />

        {/* precision hairlines */}
        <div className="absolute inset-x-0 top-[15%] h-px bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent" />
        <div className="absolute inset-x-0 bottom-[15%] h-px bg-gradient-to-r from-transparent via-foreground/[0.07] to-transparent" />

        {/* subtle depth glow */}
        <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border-2 border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="mb-7 sm:mb-8">
              <span className="eyebrow-kicker mb-5">vengryd</span>
              <h1 className="font-display text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-foreground">
                {roleHeading}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground font-body">
                {roleSubcopy}
              </p>
            </div>

            {mode !== "reset" ? (
              <div className="mb-5 flex gap-1 rounded-full border-2 border-border p-1 sm:mb-6">
              <button
                type="button"
                onClick={() => setVisibleMode("login")}
                className={`flex-1 rounded-full px-2 py-2 text-sm font-display font-semibold uppercase tracking-tight transition-colors ${
                  mode === "login" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => setVisibleMode("signup")}
                className={`flex-1 rounded-full px-2 py-2 text-sm font-display font-semibold uppercase tracking-tight transition-colors ${
                  mode === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="wait">
              {mode === "signup" && (
                <motion.div
                  key="profile-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-4 overflow-hidden"
                >
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      placeholder="Full name"
                      required={mode === "signup"}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="Username"
                      autoCapitalize="none"
                      required={mode === "signup"}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                    {form.username ? (
                      <p
                        className={`mt-1 pl-1 text-xs font-body ${
                          usernameStatus === "available"
                            ? "text-accent"
                            : usernameStatus === "checking"
                              ? "text-muted-foreground"
                              : "text-destructive"
                        }`}
                      >
                        {usernameStatus === "checking"
                          ? "Checking availability…"
                          : usernameStatus === "available"
                            ? "Username is available"
                            : usernameStatus === "taken"
                              ? "That username is taken"
                              : usernameStatus === "invalid"
                                ? "3–20 characters, letters, numbers or _"
                                : ""}
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== "reset" ? (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
            ) : null}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder={mode === "reset" ? "New password" : "Password"}
                required
                minLength={8}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={isSubmitting || !authConfigured}
                  className="text-xs font-body text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {errorMessage ? (
              <p className="text-sm text-destructive font-body">{errorMessage}</p>
            ) : null}

            {successMessage ? (
              <p className="text-sm text-accent font-body">{successMessage}</p>
            ) : null}

            {mode === "reset" ? (
              <p className="text-xs text-muted-foreground font-body">
                Use at least 8 characters. Once updated, we&apos;ll send you straight back in.
              </p>
            ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !authConfigured}
                className="mt-2 w-full rounded-xl bg-primary py-3.5 text-sm font-display font-bold uppercase tracking-tight text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Please wait..." : mode === "login" ? "Log In" : mode === "signup" ? "Join the Marketplace" : "Update Password"}
              </button>
            </form>

            {mode !== "reset" ? (
              <>
                <div className="my-6 flex items-center gap-3 sm:gap-4">
                  <div className="h-px flex-1 bg-border/40" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-body">or</span>
                  <div className="h-px flex-1 bg-border/40" />
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={oauthLoading || isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-secondary/40 px-4 py-3 text-center text-sm font-body font-medium text-foreground transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {oauthLoading ? "Redirecting to Google..." : "Continue with Google"}
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Coming soon"
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border-2 border-border bg-secondary/40 px-4 py-3 text-center text-sm font-body font-medium text-foreground opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                    </svg>
                    Continue with Apple
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  </button>
                </div>
              </>
            ) : null}

            {mode === "reset" ? (
              <p className="mt-6 text-center text-xs text-muted-foreground font-body">
                Remembered your password?{" "}
                <button
                  type="button"
                  onClick={() => setVisibleMode("login")}
                  className="font-body font-semibold text-primary hover:underline"
                >
                  Back to login
                </button>
              </p>
            ) : null}
          </div>

          <p className="mt-4 px-2 text-center text-xs leading-relaxed text-muted-foreground font-body sm:px-4">
            By continuing, you agree to vengryd&apos;s{" "}
            <a href="#" className="text-primary hover:underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>

          <div className="mt-6 flex justify-center">
            <Link
              to="/"
              className="rounded-full border-2 border-border px-6 py-2.5 text-sm font-display font-semibold uppercase tracking-tight text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
