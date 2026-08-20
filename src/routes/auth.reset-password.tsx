import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Check, Eye, EyeOff, KeyRound, Lock, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmPasswordReset, requestPasswordReset } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api-client";

interface ResetPasswordSearch {
  uidb64?: string;
  token?: string;
}

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => ({
    uidb64: typeof search.uidb64 === "string" ? search.uidb64 : undefined,
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Reset Password | Lumina Learning" },
      { name: "description", content: "Choose a new password for your Lumina Learning account." },
      { property: "og:title", content: "Reset Password | Lumina Learning" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/auth/reset-password" }],
  }),
  component: ResetPasswordPage,
});

const rules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

function ResetPasswordPage() {
  const search = useSearch({ from: "/auth/reset-password" });
  const navigate = useNavigate();

  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const hasToken = Boolean(search.uidb64 && search.token);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await requestPasswordReset(email);
      setEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send reset email. Please try again."));
    } finally {
      setPending(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules.every((r) => r.test(password))) {
      setError("Your password does not meet all the requirements below.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await confirmPasswordReset(search.uidb64!, search.token!, password);
      toast.success(res?.message || res?.detail || "Password reset successfully! Please sign in.");
      setTimeout(() => {
        void navigate({ to: "/auth/login" });
      }, 1500);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reset password. The link may be expired or invalid."));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-rose/40 px-6 py-16">
      <div className="w-full max-w-[460px]">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <KeyRound className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {hasToken ? "Set a new password" : "Reset your password"}
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {hasToken
              ? "Choose a new password for your account."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {hasToken ? (
          <form onSubmit={handleConfirmReset} className="surface-card mt-8 space-y-5 p-8">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="field-label">
                New Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="new-password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="h-12 rounded-xl pl-11 pr-11"
                  required
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

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="field-label">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="confirm-password"
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  className="h-12 rounded-xl pl-11"
                  required
                />
              </div>
            </div>

            <ul className="space-y-2 rounded-xl bg-accent/40 p-4 border border-border/50">
              {rules.map((r) => {
                const ok = r.test(password);
                return (
                  <li key={r.label} className={`flex items-center gap-2 text-xs font-medium ${ok ? "text-success" : "text-muted-foreground"}`}>
                    <Check className={`size-3.5 ${ok ? "text-success" : "text-muted-foreground/50"}`} aria-hidden />
                    {r.label}
                  </li>
                );
              })}
            </ul>

            {error ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl text-sm font-semibold">
              {pending ? "Resetting…" : "Confirm New Password"}
            </Button>

            <div className="pt-2 text-center">
              <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="size-3.5" aria-hidden /> Back to sign in
              </Link>
            </div>
          </form>
        ) : emailSent ? (
          <div className="surface-card mt-8 space-y-5 p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-6" aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-foreground">Check your inbox</h2>
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>. Click the link in that email to choose a new password.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="h-12 w-full rounded-xl mt-4"
            >
              Try another email
            </Button>
            <div className="pt-2">
              <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="size-3.5" aria-hidden /> Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRequestReset} className="surface-card mt-8 space-y-5 p-8">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="field-label">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="you@example.com"
                  className="h-12 rounded-xl pl-11"
                  required
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl text-sm font-semibold">
              {pending ? "Sending…" : "Send Reset Link"}
            </Button>

            <div className="pt-2 text-center">
              <Link to="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="size-3.5" aria-hidden /> Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
