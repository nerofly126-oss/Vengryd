import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LeafCorners from "@/components/Leafcorners";
import { getSupabaseClient } from "@/lib/supabase";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  const normalizedRole = role === "buyer" || role === "seller" ? role : null;
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!normalizedRole) {
      navigate("/auth/select", { replace: true });
      return;
    }

    let isMounted = true;

    const checkSession = async () => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted && session) {
          navigate("/", { replace: true });
        }
      } catch {
        // Let the page render normally if auth env vars are not configured yet.
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate, normalizedRole]);

  const roleLabel = normalizedRole === "seller" ? "seller" : "buyer";
  const roleHeading =
    normalizedRole === "seller" ? "Sell through the community" : "Shop through the community";
  const roleSubcopy =
    mode === "login"
      ? `Welcome back, ${roleLabel}.`
      : `Create your ${roleLabel} account to get started.`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    resetMessages();
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth?role=${roleLabel}`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Unable to continue with ${provider}.`,
      );
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    const normalizedEmail = form.email.trim().toLowerCase();
    const password = form.password.trim();

    try {
      const supabase = getSupabaseClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?role=${roleLabel}`,
            data: {
              full_name: form.fullName.trim(),
              username: form.username.trim(),
              role: roleLabel,
            },
          },
        });

        if (error) {
          throw error;
        }

        setSuccessMessage("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          throw error;
        }

        navigate("/", { replace: true });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to complete authentication.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background relative overflow-hidden">
      <LeafCorners />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[-4rem] h-64 w-64 rounded-full bg-primary/5 blur-[96px] sm:top-1/4 sm:left-1/4 sm:h-96 sm:w-96 sm:blur-[120px]" />
        <div className="absolute bottom-16 right-[-3rem] h-56 w-56 rounded-full bg-accent/5 blur-[88px] sm:bottom-1/4 sm:right-1/4 sm:h-80 sm:w-80 sm:blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-[100dvh] items-start justify-center overflow-y-auto px-4 py-6 sm:items-center sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            to="/auth/select"
            className="mb-5 inline-flex items-center text-muted-foreground transition-colors hover:text-foreground font-body text-sm sm:mb-8"
          >
            Back to role selection
          </Link>

          <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-8">
            <div className="mb-6 text-center sm:mb-8">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-primary font-body">
                {roleLabel}
              </span>
              <h1 className="font-display text-2xl font-bold tracking-wide text-foreground">
                <span className="block pt-4 text-3xl sm:text-[2rem]">{roleHeading}</span>
              </h1>
              <p className="mt-2 px-3 text-sm text-muted-foreground font-body sm:px-0">
                {roleSubcopy}
              </p>
            </div>

            <div className="mb-5 flex flex-col gap-3 sm:mb-6">
              <button
                type="button"
                onClick={() => void handleOAuth("google")}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-center text-sm font-medium text-foreground transition-all hover:bg-secondary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 font-body"
              >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => void handleOAuth("apple")}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-center text-sm font-medium text-foreground transition-all hover:bg-secondary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 font-body"
              >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
                Continue with Apple
              </button>
            </div>

            <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-body">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="mb-5 flex rounded-xl bg-secondary/50 p-1 sm:mb-6">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode("login");
                }}
                className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-all font-body ${
                  mode === "login"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode("signup");
                }}
                className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-all font-body ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-body text-sm">@</span>
                    <input
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      placeholder="username"
                      required={mode === "signup"}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
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
                <button type="button" className="text-primary text-xs font-body hover:underline">
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 hover:shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-60 font-display"
              >
                {isSubmitting ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground font-body">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setMode("signup");
                    }}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setMode("login");
                    }}
                    className="text-primary hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
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
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
