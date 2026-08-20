import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign, Eye, EyeOff, GraduationCap, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { getApiErrorMessage } from "@/lib/api-client";
import { isColdStartOrNetworkError, waitForServerWakeup } from "@/lib/server-health";
import { ServerWarmingModal } from "@/components/server-warming-modal";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Create an Account | Lumina Learning" },
      { name: "description", content: "Create your Lumina Learning account to enrol in courses and earn credentials." },
      { property: "og:title", content: "Create an Account | Lumina Learning" },
      { property: "og:description", content: "Join Lumina Learning and start learning today." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/auth/register" }],
  }),
  component: RegisterPage,
});

type Fields = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm: string;
};

const empty: Fields = { username: "", email: "", first_name: "", last_name: "", password: "", confirm: "" };

function RegisterPage() {
  const { register } = useAuth();
  const [values, setValues] = useState<Fields>(empty);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [isWarming, setIsWarming] = useState(false);

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const attemptRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!values.username.trim() || !values.first_name.trim() || !values.last_name.trim()) {
      setError("Username, first name and last name are required.");
      return;
    }
    if (!values.email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (values.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (values.password !== values.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setPending(true);

    const warmingTimer = setTimeout(() => {
      setIsWarming(true);
    }, 2500);

    const payload = {
      username: values.username,
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
      password: values.password,
      password2: values.confirm,
    };

    try {
      await register(payload);
      clearTimeout(warmingTimer);
      setIsWarming(false);
      toast.success("Account created — welcome!");
      // Hard-navigate so the root shell picks up the new auth state
      window.location.href = "/";
    } catch (err: unknown) {
      clearTimeout(warmingTimer);
      if (isColdStartOrNetworkError(err)) {
        setIsWarming(true);
        const awake = await waitForServerWakeup({ maxWaitSeconds: 70 });
        if (awake) {
          try {
            await register(payload);
            setIsWarming(false);
            toast.success("Connected! Account created — welcome!");
            window.location.href = "/";
            return;
          } catch (retryErr) {
            setIsWarming(false);
            setError(getApiErrorMessage(retryErr, "Registration failed. Please try again."));
          }
        } else {
          setIsWarming(false);
          setError("Server is taking longer than usual to wake up. Please refresh or try again in a few seconds.");
        }
      } else {
        setIsWarming(false);
        setError(err instanceof Error ? err.message : getApiErrorMessage(err, "Registration failed. Please try again."));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas-rose/40 px-6 py-16">
      <div className="w-full max-w-[560px]">
        <div className="text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Create your account</h1>
          <p className="mt-1.5 text-base text-muted-foreground">Join Lumina Learning and start learning today.</p>
        </div>

        <form onSubmit={submit} className="surface-card mt-8 space-y-5 p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="field-label">
                First Name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input id="first_name" value={values.first_name} onChange={set("first_name")} placeholder="Jane" className="h-12 rounded-xl pl-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="field-label">
                Last Name
              </Label>
              <Input id="last_name" value={values.last_name} onChange={set("last_name")} placeholder="Doe" className="h-12 rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="field-label">
              Username
            </Label>
            <div className="relative">
              <AtSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="username" value={values.username} onChange={set("username")} placeholder="janedoe" className="h-12 rounded-xl pl-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="field-label">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="email" type="email" value={values.email} onChange={set("email")} placeholder="you@example.com" className="h-12 rounded-xl pl-11" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password" className="field-label">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={values.password}
                  onChange={set("password")}
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
              <Label htmlFor="confirm" className="field-label">
                Confirm Password
              </Label>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                value={values.confirm}
                onChange={set("confirm")}
                placeholder="••••••••"
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}

          <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl">
            {pending ? "Connecting…" : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        <ServerWarmingModal
          open={isWarming}
          onOpenChange={setIsWarming}
          title="Connecting to Server…"
          description="Our cloud backend is currently waking up from sleep mode (~30–45s). As soon as the server is ready, we'll finish setting up your account!"
          onRetry={() => void attemptRegister()}
        />
      </div>
    </div>
  );
}
