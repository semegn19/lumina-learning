import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, GraduationCap, Loader2, ShieldCheck, Ticket } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api, getApiErrorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/payment/verify")({
  head: () => ({
    meta: [
      { title: "Verifying Payment | Lumina Learning" },
      { name: "description", content: "Verifying transaction and activating access." },
    ],
  }),
  component: PaymentVerifyPage,
});

function PaymentVerifyPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState<string>("Verifying your payment with the payment gateway…");
  const [isEventPayment, setIsEventPayment] = useState<boolean>(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    async function performVerification() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get("reference") || urlParams.get("trxref") || "";
        const sessionId = urlParams.get("session_id") || undefined;
        const providerParam = urlParams.get("provider"); // e.g. "PS", "FW", "ST"

        if (!ref && !sessionId) {
          setStatus("error");
          setMessage("No payment reference or session ID was provided in the callback URL.");
          return;
        }

        // Determine payment provider if not explicitly passed
        let provider = providerParam;
        if (!provider) {
          provider = sessionId ? "ST" : "PS";
        }

        // Call Verification API: POST /api/payments/verify/
        const res = await api.post<{ status: string; message?: string }>("/api/payments/verify/", {
          provider,
          reference: ref,
          session_id: sessionId,
        });

        // Check if payment was successful (backend returns status 'S' or 'success')
        if (res.data?.status === "S" || res.data?.status === "success") {
          const isEvt =
            urlParams.get("type") === "event" ||
            (typeof window !== "undefined" && window.sessionStorage.getItem("last_payment_type") === "event") ||
            (res.data as any)?.type === "event" ||
            (res.data as any)?.event_id !== undefined;

          if (typeof window !== "undefined") {
            window.sessionStorage.removeItem("last_payment_type");
          }

          setIsEventPayment(isEvt);
          setStatus("success");
          setMessage(
            isEvt
              ? "Payment verified successfully! Your event ticket registration is confirmed."
              : "Payment verified successfully! Your course enrollment has been activated."
          );
          toast.success("Payment verified! Access activated.");

          // Invalidate enrollment, course, and event caches so changes reflect immediately
          void queryClient.invalidateQueries({ queryKey: ["enrollments"] });
          void queryClient.invalidateQueries({ queryKey: ["my-learning"] });
          void queryClient.invalidateQueries({ queryKey: ["courses"] });
          void queryClient.invalidateQueries({ queryKey: ["events"] });
          void queryClient.invalidateQueries({ queryKey: ["event"] });
          void queryClient.invalidateQueries({ queryKey: ["event-attendees"] });

          // Redirect to appropriate page after confirmation
          setTimeout(() => {
            void navigate({
              to: isEvt ? "/events" : "/my-learning",
            });
          }, 1500);
        } else {
          setStatus("error");
          setMessage(
            res.data?.message ||
              `Payment verification returned status: ${res.data?.status || "Incomplete"}. Please contact support if you were charged.`
          );
          toast.error("Payment could not be verified.");
        }
      } catch (err) {
        setStatus("error");
        setMessage(getApiErrorMessage(err, "Payment verification failed. Please try again or contact support."));
        toast.error("Payment verification failed.");
      }
    }

    void performVerification();
  }, [navigate, queryClient]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md surface-card p-8 text-center shadow-lg">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary">
              <Loader2 className="size-8 animate-spin" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Verifying Payment
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground/80">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              <span>Secure SSL encrypted verification</span>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
              <CheckCircle2 className="size-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Payment Confirmed!
            </h1>
            <p className="text-sm text-muted-foreground">{message}</p>
            <p className="text-xs text-primary font-medium">
              {isEventPayment ? "Redirecting to Events…" : "Redirecting to My Learning…"}
            </p>

            <div className="mt-4 w-full">
              <Button asChild className="w-full rounded-xl gap-2 font-semibold">
                <Link to={isEventPayment ? "/events" : "/my-learning"}>
                  {isEventPayment ? (
                    <>
                      <Ticket className="size-4" aria-hidden /> Go to Events
                    </>
                  ) : (
                    <>
                      <GraduationCap className="size-4" aria-hidden /> Go to My Learning
                    </>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-destructive-soft text-destructive">
              <AlertCircle className="size-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Verification Issue
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>

            <div className="mt-6 flex w-full flex-col gap-2">
              <Button asChild className="w-full rounded-xl">
                <Link to="/courses">Browse Courses</Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link to="/my-learning">Check My Learning</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
