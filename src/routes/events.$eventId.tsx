import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Share2,
  Star,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import eventCover from "@/assets/course-typography.jpg";
import { PaymentDialog } from "@/components/payment-dialog";
import { Button } from "@/components/ui/button";
import { getEventById, registerForEvent } from "@/lib/events-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatPrice, getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/events/$eventId")({
  head: () => ({
    meta: [
      { title: "Event Details | Lumina Learning" },
      {
        name: "description",
        content: "View details and register for workshops, symposiums and masterclasses.",
      },
    ],
  }),
  component: EventDetails,
});

function formatBackendDateTime(isoString?: string) {
  if (!isoString) return { dateStr: "TBD", timeStr: "" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: isoString, timeStr: "" };
    }
    const dateStr = d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { dateStr, timeStr };
  } catch {
    return { dateStr: isoString, timeStr: "" };
  }
}

function EventDetails() {
  const { eventId } = useParams({ from: "/events/$eventId" });
  const queryClient = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string | undefined>(undefined);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(eventId),
    enabled: !!eventId,
  });

  const registerMut = useMutation({
    mutationFn: () => registerForEvent(eventId),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });

      if (res.status === "S") {
        toast.success(res.message || "Registered successfully for this event!");
      } else if (res.status === "P") {
        toast.info(res.message || "Registration pending payment...");
        if (res.reference) {
          setPaymentRef(res.reference);
        }
        setPayOpen(true);
      } else {
        toast.success(res.message || "Registration request submitted successfully.");
      }
    },
    onError: (err) => {
      const msg = getApiErrorMessage(err);
      toast.error(msg || "Failed to register for event.");
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-canvas">
        <div className="mx-auto max-w-[1000px] px-6 pt-12 text-center">
          <h1 className="text-2xl font-bold">Event Not Found</h1>
          <p className="mt-2 text-muted-foreground">The requested event could not be found.</p>
          <Button asChild className="mt-6">
            <Link to="/events">← Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const numericPrice = typeof event.price === "number" ? event.price : parseFloat(String(event.price || 0));
  const isFree = isNaN(numericPrice) || numericPrice <= 0;
  const amount = formatPrice(event.price, event.currency);
  const { dateStr, timeStr } = formatBackendDateTime(event.date);
  const isAlreadyRegistered = event.is_registered === true;

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1000px] px-6 py-8 md:px-8">
        <Link to="/events" className="mt-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to all events
        </Link>

        {/* Title comes before the cover image */}
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{event.title}</h1>

        <div className="mt-6 overflow-hidden rounded-3xl">
          <img
            src={getMediaUrl(event.picture || event.image || event.thumbnail || event.cover_image) || eventCover}
            alt={`Cover for ${event.title}`}
            loading="lazy"
            width={1200}
            height={630}
            className="aspect-[21/9] w-full object-cover"
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div>
            {/* Description header label and text */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</h2>
              <p className="mt-2 text-lg text-muted-foreground whitespace-pre-line">{event.description}</p>
            </div>

            {/* Standardized 4-card grid including Featured Guest */}
            <section className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="surface-card flex items-start gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <CalendarDays className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Date</p>
                  <p className="mt-1 font-semibold">{dateStr}</p>
                </div>
              </div>

              {timeStr && (
                <div className="surface-card flex items-start gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Clock className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Time</p>
                    <p className="mt-1 font-semibold">{timeStr}</p>
                  </div>
                </div>
              )}

              <div className="surface-card flex items-start gap-4 p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Place / Location</p>
                  <p className="mt-1 font-semibold">{event.place || "Online"}</p>
                </div>
              </div>

              {event.featured_guest && (
                <div className="surface-card flex items-start gap-4 p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Star className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Featured Guest</p>
                    <p className="mt-1 font-semibold">{event.featured_guest}</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="surface-card sticky top-6 p-7">
            <p className="text-xs font-semibold text-muted-foreground">Ticket price</p>
            <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{amount}</p>

            <Button
              disabled={isAlreadyRegistered || registerMut.isPending}
              variant={isAlreadyRegistered ? "secondary" : "default"}
              className="mt-6 w-full gap-2 rounded-lg"
              onClick={() => {
                if (isAlreadyRegistered) return;
                if (isFree) {
                  registerMut.mutate();
                } else {
                  setPayOpen(true);
                }
              }}
            >
              {isAlreadyRegistered ? (
                <>
                  <Check className="size-4 text-success" aria-hidden /> Already Registered
                </>
              ) : registerMut.isPending ? (
                "Registering..."
              ) : (
                <>
                  <Ticket className="size-4" aria-hidden /> {isFree ? "Register for Free" : "Register Now"}
                </>
              )}
            </Button>

            <button
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href);
                toast.success("Event link copied to clipboard!");
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Share2 className="size-4" aria-hidden /> Share this event
            </button>
          </aside>
        </div>
      </main>

      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        title="Complete your event registration"
        description={`Choose a payment method to purchase your ticket for "${event.title}".`}
        amount={String(numericPrice)}
        eventId={Number(event.id)}
        currency={event.currency || "USD"}
      />
    </div>
  );
}
