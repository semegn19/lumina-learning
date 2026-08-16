import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  Globe2,
  Heart,
  HeartHandshake,
  Sparkle,
  Sprout,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PaymentDialog } from "@/components/payment-dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/donations")({
  head: () => ({
    meta: [
      { title: "Support Lumina Learning — Donate | Lumina Learning" },
      {
        name: "description",
        content:
          "Give any amount to keep Lumina Learning free for scholarship students. Pay securely with Paystack, Flutterwave or Stripe.",
      },
      { property: "og:title", content: "Support Lumina Learning — Donate" },
      { property: "og:description", content: "Your gift funds scholarships, new courses and free community events." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/donations" }],
  }),
  component: Donations,
});

const presets = [10, 25, 50, 100];

const reasons = [
  {
    icon: BookOpen,
    title: "Why you should donate",
    body: "Every course we publish stays free for learners on our scholarship track. Your gift keeps that promise alive.",
    tone: "bg-primary-soft text-primary",
  },
  {
    icon: Globe2,
    title: "Help us make impact",
    body: "We ship lessons to 42 countries. Donations pay for translations, captions and low-bandwidth video.",
    tone: "bg-info-soft text-info",
  },
  {
    icon: Sprout,
    title: "Grow new creators",
    body: "We mentor emerging instructors and cover their production costs for their very first course.",
    tone: "bg-success-soft text-success",
  },
];

const impact = [
  { value: "3,214", label: "Scholarships funded", icon: Users },
  { value: "128", label: "Free lessons published", icon: BookOpen },
  { value: "42", label: "Countries reached", icon: Globe2 },
];

function Donations() {
  const [amount, setAmount] = useState("25");
  const [payOpen, setPayOpen] = useState(false);

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <section className="overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-1.5 text-xs font-bold tracking-wide">
            <HeartHandshake className="size-3.5" aria-hidden /> COMMUNITY SUPPORTED
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl leading-tight">
            Give any amount. Open a door for someone.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85 text-base">
            Lumina Learning is powered by learners like you. 100% of donations fund scholarships, free events and new
            open courses.
          </p>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              {impact.map((i) => (
                <div key={i.label} className="surface-card p-6 text-center">
                  <span className="mx-auto grid size-11 place-items-center rounded-xl bg-accent text-primary">
                    <i.icon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-4 font-display text-3xl font-semibold text-foreground">{i.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{i.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {reasons.map((r) => (
                <article key={r.title} className="surface-card p-7">
                  <span className={`grid size-11 place-items-center rounded-xl ${r.tone}`}>
                    <r.icon className="size-5" aria-hidden />
                  </span>
                  <h2 className="mt-5 text-xl font-bold">{r.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                </article>
              ))}

              <article className="rounded-2xl bg-accent p-7">
                <span className="grid size-11 place-items-center rounded-xl bg-card text-primary">
                  <Sparkle className="size-5" aria-hidden />
                </span>
                <h2 className="mt-5 text-xl font-bold">Where your money goes</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {[
                    ["Scholarships", "62%"],
                    ["Course production", "26%"],
                    ["Free community events", "12%"],
                  ].map(([label, pct]) => (
                    <li key={label}>
                      <div className="flex justify-between font-medium text-foreground">
                        <span>{label}</span>
                        <span>{pct}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-card">
                        <div className="h-2 rounded-full bg-primary" style={{ width: pct }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>

          <aside className="surface-card sticky top-6 p-8">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Heart className="size-5 text-primary" aria-hidden /> Make a donation
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Choose an amount, or enter your own.</p>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`h-11 rounded-xl border text-sm font-semibold transition-colors ${
                    amount === String(p)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!valid) {
                  toast.error("Enter an amount greater than zero");
                  return;
                }
                setPayOpen(true);
              }}
            >
              <div>
                <label htmlFor="donation-amount" className="field-label">
                  Custom amount (USD)
                </label>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <input
                    id="donation-amount"
                    type="number"
                    min={1}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 w-full rounded-xl border border-input bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="donation-note" className="field-label">
                  Leave a note (optional)
                </label>
                <textarea
                  id="donation-note"
                  rows={3}
                  placeholder="Tell us what inspired your gift…"
                  className="mt-2 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <Button type="submit" className="w-full gap-2 rounded-lg">
                <Heart className="size-4" aria-hidden /> Donate {valid ? `$${numeric.toFixed(2)}` : ""}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You'll pick Paystack, Flutterwave or Stripe on the next step.
              </p>
            </form>
          </aside>
        </div>
      </main>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title="Choose how to donate"
        description="Pick the gateway you'd like to complete your gift with."
        amount={valid ? `$${numeric.toFixed(2)} USD` : undefined}
      />
    </div>
  );
}
