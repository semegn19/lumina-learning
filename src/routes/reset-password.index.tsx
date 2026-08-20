import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, KeyRound, Mail, AlertCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth-api";
import { getApiErrorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/reset-password/")({
  head: () => ({
    meta: [
      { title: "Reset Password | Lumina Learning" },
      { name: "description", content: "Request a password reset link for your Lumina Learning account." },
      { property: "og:title", content: "Reset Password | Lumina Learning" },
      { property: "og:description", content: "Request a password reset link." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/reset-password" }],
  }),
  component: ResetPasswordIndexPage,
});

function ResetPasswordIndexPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

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

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-rose/40 px-6 py-16">
      <div className="w-full max-w-[460px]">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <KeyRound className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Reset your password</h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {emailSent ? (
          <div className="surface-card mt-8 space-y-5 p-8 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success">
              <Check className="size-6" aria-hidden />
            </div>
            <h2 className="text-xl font-bold text-foreground">Check your inbox</h2>
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to <strong className="text-foreground">{email}</strong>. Follow the instructions in the email to set a new password.
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
