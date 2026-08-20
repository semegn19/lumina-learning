import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { requestPasswordReset } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { isColdStartOrNetworkError, waitForServerWakeup } from "@/lib/server-health";
import { ServerWarmingModal } from "@/components/server-warming-modal";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Sign In | Lumina Learning" },
      { name: "description", content: "Sign in to your Lumina Learning account to continue learning." },
      { property: "og:title", content: "Sign In | Lumina Learning" },
      { property: "og:description", content: "Sign in to continue your learning journey." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/auth/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [isWarming, setIsWarming] = useState(false);

  const attemptLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setError(null);
    setPending(true);

    // If request takes longer than 2.5 seconds, pop the warming modal to keep user informed
    const warmingTimer = setTimeout(() => {
      setIsWarming(true);
    }, 2500);

    try {
      await login(email, password);
      clearTimeout(warmingTimer);
      setIsWarming(false);
      toast.success("Welcome back!");
      // Hard navigate so the root shell re-renders with the new auth state
      window.location.href = "/";
    } catch (err: unknown) {
      clearTimeout(warmingTimer);
      if (isColdStartOrNetworkError(err)) {
        setIsWarming(true);
        // Server might be in the middle of spinning up; wait for it and retry
        const awake = await waitForServerWakeup({ maxWaitSeconds: 70 });
        if (awake) {
          try {
            await login(email, password);
            setIsWarming(false);
            toast.success("Connected! Welcome back!");
            window.location.href = "/";
            return;
          } catch (retryErr) {
            setIsWarming(false);
            setError(getApiErrorMessage(retryErr, "Invalid email or password."));
          }
        } else {
          setIsWarming(false);
          setError("Server is taking longer than usual to wake up. Please refresh or try again in a few seconds.");
        }
      } else {
        setIsWarming(false);
        setError(err instanceof Error ? err.message : getApiErrorMessage(err, "Invalid email or password."));
      }
    } finally {
      setPending(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.includes("@")) {
      toast.error("Enter your email address above, then click 'Forgot password?'");
      return;
    }
    setResetPending(true);
    try {
      await requestPasswordReset(email);
      toast.success("Password reset link sent — check your inbox.");
    } catch {
      toast.error("Could not send reset email. Please try again.");
    } finally {
      setResetPending(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-rose/40 px-6 py-16">
      <div className="w-full max-w-[440px]">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Welcome back</h1>
          <p className="mt-1.5 text-base text-muted-foreground">Sign in to continue your learning journey.</p>
        </div>

        <form onSubmit={attemptLogin} className="surface-card mt-8 space-y-5 p-8">
          <div className="space-y-2">
            <Label htmlFor="email" className="field-label">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl pl-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="field-label">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 rounded-xl pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox aria-label="Remember me" /> Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetPending}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
            >
              {resetPending ? "Sending…" : "Forgot password?"}
            </button>
          </div>

          <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl">
            {pending ? "Connecting…" : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </form>

        <ServerWarmingModal
          open={isWarming}
          onOpenChange={setIsWarming}
          title="Connecting to Server…"
          description="Our cloud backend is currently waking up from sleep mode (~30–45s). As soon as the server is ready, we'll sign you in automatically!"
          onRetry={() => void attemptLogin()}
        />
      </div>
    </div>
  );
}
