import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck, Ticket, Wallet, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";                    

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initializePayment } from "@/lib/payments-certificates-api";
import { validateDiscount } from "@/lib/discounts-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import type { PaymentProvider as ApiPaymentProvider, CourseCurrency } from "@/lib/api-types";

export type PaymentProvider = "paystack" | "flutterwave" | "stripe";

const providerMap: Record<PaymentProvider, ApiPaymentProvider> = {
  paystack: "PS",
  flutterwave: "FW",
  stripe: "ST",
};

const providers: {
  id: PaymentProvider;
  name: string;
  blurb: string;
  icon: typeof Wallet;
  tone: string;
}[] = [
  {
    id: "paystack",
    name: "Paystack",
    blurb: "Cards, bank transfer & USSD",
    icon: Zap,
    tone: "bg-info-soft text-info",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    blurb: "Mobile money & local cards",
    icon: Wallet,
    tone: "bg-tile-amber text-foreground",
  },
  {
    id: "stripe",
    name: "Stripe",
    blurb: "International cards & wallets",
    icon: CreditCard,
    tone: "bg-primary-soft text-primary",
  },
];

export function PaymentDialog({
  open,
  onOpenChange,
  title = "Choose a payment method",
  description = "Select a gateway to complete your payment securely.",
  amount,
  courseId,
  eventId,
  currency = "USD",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string | undefined;
  description?: string | undefined;
  amount?: string | undefined;
  courseId?: number | undefined;
  eventId?: number | undefined;
  currency?: CourseCurrency | string | undefined;
}) {
  const [pending, setPending] = useState<PaymentProvider | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percentage: number;
    originalPrice: string | number;
    discountedPrice: string | number;
  } | null>(null);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    if (!courseId) {
      toast.error("Promo codes can only be applied when purchasing a specific course.");
      return;
    }

    setValidatingPromo(true);
    setPromoError(null);

    try {
      const res = await validateDiscount(courseId, promoCode);
      if (res.valid) {
        const orig = res.original_price || amount || "0.00";
        const disc = res.discounted_price || "0.00";
        const pct = res.percentage || 0;
        const codeClean = res.code || promoCode.trim().toUpperCase();

        setAppliedDiscount({
          code: codeClean,
          percentage: pct,
          originalPrice: orig,
          discountedPrice: disc,
        });

        toast.success(`Promo code "${codeClean}" applied! You save ${pct}%.`);
      } else {
        const errMsg = res.error || res.detail || "Invalid or expired promo code.";
        setPromoError(errMsg);
        setAppliedDiscount(null);
        toast.error(errMsg);
      }
    } catch (err) {
      const errMsg = getApiErrorMessage(err) || "Failed to validate promo code.";
      setPromoError(errMsg);
      setAppliedDiscount(null);
      toast.error(errMsg);
    } finally {
      setValidatingPromo(false);
    }
  };

  const pay = async (p: PaymentProvider) => {
    setPending(p);
    const name = providers.find((x) => x.id === p)!.name;

    try {
      if ((courseId || eventId) && amount) {
        toast.info(`Initializing ${name} checkout…`);

        const effectiveAmountStr = appliedDiscount
          ? String(appliedDiscount.discountedPrice)
          : amount;
        const numAmount = effectiveAmountStr.replace(/[^0-9.]/g, "");

        const res = await initializePayment({
          provider: providerMap[p],
          course_id: courseId,
          event_id: eventId,
          amount: numAmount || "0.00",
          currency: (currency as any) || "USD",
          promo_code: appliedDiscount ? appliedDiscount.code : undefined,
        });

        toast.success(`Redirecting to ${name}…`);
        onOpenChange(false);
        if (res.checkout_url || res.payment_url || res.url) {
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem("last_payment_type", eventId ? "event" : "course");
          }
          window.location.href = res.checkout_url || res.payment_url || res.url!;
        }
      } else {
        // Direct gateway fallback if neither courseId nor eventId provided
        const fallbackUrls: Record<PaymentProvider, string> = {
          paystack: "https://checkout.paystack.com/",
          flutterwave: "https://checkout.flutterwave.com/",
          stripe: "https://checkout.stripe.com/",
        };
        toast.success(`Redirecting to ${name}…`);
        onOpenChange(false);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("last_payment_type", eventId ? "event" : "course");
        }
        window.open(fallbackUrls[p], "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      toast.error(`Payment initialization failed: ${getApiErrorMessage(err)}`);
    } finally {
      setPending(null);
    }
  };

  const displayOriginalPrice = amount;
  const displayDiscountedPrice = appliedDiscount
    ? formatPrice(appliedDiscount.discountedPrice, currency)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Promo Code Input (when purchasing a course) */}
        {courseId ? (
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <label htmlFor="dialog-promo" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Ticket className="size-3.5 text-primary" /> Have a Promo / Discount Code?
            </label>
            <div className="flex gap-2">
              <input
                id="dialog-promo"
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void handleApplyPromo())}
                placeholder="e.g. SUMMER20"
                className="h-10 flex-1 rounded-lg border border-input bg-background px-3 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-ring/30"
              />
              <Button
                type="button"
                variant="outline"
                disabled={validatingPromo || !promoCode.trim()}
                onClick={() => void handleApplyPromo()}
                className="h-10 rounded-lg px-4 text-xs font-semibold"
              >
                {validatingPromo ? "Checking..." : "Apply"}
              </Button>
            </div>
            {promoError && (
              <p className="text-xs font-medium text-destructive">{promoError}</p>
            )}
            {appliedDiscount && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Code "{appliedDiscount.code}" applied! You get {appliedDiscount.percentage}% OFF.
              </p>
            )}
          </div>
        ) : null}

        {/* Price Box */}
        {amount ? (
          <div className="flex items-center justify-between rounded-xl bg-accent px-4 py-3">
            <span className="text-sm text-muted-foreground">Total due</span>
            <div className="text-right">
              {appliedDiscount ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">{displayOriginalPrice}</span>
                  <span className="font-display text-xl font-bold text-success">{displayDiscountedPrice}</span>
                </div>
              ) : (
                <span className="font-display text-xl font-bold">{amount}</span>
              )}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={pending !== null}
              onClick={() => pay(p.id)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/50 disabled:opacity-60"
            >
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${p.tone}`}>
                <p.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{p.name}</span>
                <span className="block text-sm text-muted-foreground">{p.blurb}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 text-success" aria-hidden />
          Payments are encrypted and processed by the gateway you choose.
        </p>

        <Button variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
