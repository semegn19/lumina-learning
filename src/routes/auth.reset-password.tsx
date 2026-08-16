import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | Lumina Learning" },
      { name: "description", content: "Choose a new password for your Serene Academy account." },
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
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = (e: React.FormEvent) => {
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
    window.setTimeout(() => {
      setPending(false);
      toast.success("Password reset successfully");
      void navigate({ to: "/auth/login" });
    }, 700);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-rose/40 px-6 py-16">
      <div className="w-full max-w-[460px]">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <KeyRound className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Set a new password</h1>
          <p className="mt-1.5 text-base text-muted-foreground">Enter your new password twice to confirm it.</p>
        </div>

        <form onSubmit={submit} className="surface-card mt-8 space-y-5 p-8">
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

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="field-label">
              Confirm New Password
            </Label>
            <Input
              id="confirm-password"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="h-12 rounded-xl"
            />
          </div>

          <ul className="space-y-2 rounded-xl bg-accent p-4">
            {rules.map((r) => {
              const ok = r.test(password);
              return (
                <li key={r.label} className={`flex items-center gap-2 text-sm ${ok ? "text-success" : "text-muted-foreground"}`}>
                  <Check className="size-4" aria-hidden /> {r.label}
                </li>
              );
            })}
          </ul>

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl">
            {pending ? "Resetting…" : "Confirm New Password"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link to="/auth/login" className="font-semibold text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
