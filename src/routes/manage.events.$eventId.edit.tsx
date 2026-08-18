import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, ImagePlus, MapPin, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { ListOptionChooser } from "@/components/ui/list-option-chooser";
import { getEventById, updateEvent } from "@/lib/events-api";
import { getApiErrorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/manage/events/$eventId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Event | Lumina Learning" },
      { name: "description", content: "Update the cover, schedule, venue, and pricing of your event." },
      { property: "og:title", content: "Edit Event | Lumina Learning" },
      { property: "og:description", content: "Update the details of a scheduled learning session." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <EditEvent />
    </AdminGuard>
  ),
});

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30";

function EditEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { eventId } = useParams({ from: "/manage/events/$eventId/edit" });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [featuredGuest, setFeaturedGuest] = useState("");
  const [price, setPrice] = useState("0.00");
  const [currency, setCurrency] = useState("USD");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEventById(eventId),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");
      if (event.date) {
        if (event.date.includes("T")) {
          const [dPart, tPart] = event.date.split("T");
          setDate(dPart || "");
          setTime(tPart ? tPart.slice(0, 5) : "");
        } else {
          setDate(event.date);
        }
      }
      setPlace(event.place || "");
      setFeaturedGuest(event.featured_guest || "");
      setPrice(String(event.price ?? "0.00"));
      setCurrency(event.currency || "USD");
      if (event.image) {
        setImagePreview(event.image);
      }
    }
  }, [event]);

  const updateMut = useMutation({
    mutationFn: async () => {
      const isoDateTime = time ? `${date}T${time}:00Z` : date ? `${date}T00:00:00Z` : "";

      return await updateEvent(eventId, {
        title,
        description,
        date: isoDateTime,
        place,
        featured_guest: featuredGuest,
        price: parseFloat(price) || 0,
        currency,
        image: imageFile || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Event updated successfully!");
      void queryClient.invalidateQueries({ queryKey: ["event", eventId] });
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void navigate({ to: "/manage/events" });
    },
    onError: (err) => {
      toast.error(`Failed to update event: ${getApiErrorMessage(err)}`);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas-rose/40">
        <div className="mt-20 flex justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[880px] px-6 py-8 md:px-8">
        <Link to="/manage/events" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to my events
        </Link>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Edit Event</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Update the details for <span className="font-medium text-foreground">{event?.title || eventId}</span>.
        </p>

        <form
          className="surface-card mt-10 space-y-7 p-9"
          onSubmit={(e) => {
            e.preventDefault();
            updateMut.mutate();
          }}
        >
          <div>
            <p className="field-label">Event Cover Picture</p>
            <label className="mt-3 flex h-48 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-primary/40 bg-primary-soft/30 text-center transition-colors hover:bg-primary-soft/50">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
                  <span className="text-sm">Click to upload cover image</span>
                  <span className="text-xs font-medium text-muted-foreground">1200 x 630px recommended (JPG, PNG)</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
            </label>
          </div>

          <div>
            <label htmlFor="event-title" className="field-label">
              Event Title
            </label>
            <input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={`${inputClass} mt-3`}
            />
          </div>

          <div>
            <label htmlFor="event-desc" className="field-label">
              Description
            </label>
            <textarea
              id="event-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="mt-3 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label htmlFor="event-date" className="field-label">
                Date
              </label>
              <DatePicker
                id="event-date"
                value={date}
                onChange={(val) => setDate(val)}
                placeholder="Select event date"
              />
            </div>

            <div className="space-y-3">
              <label htmlFor="event-time" className="field-label">
                Time
              </label>
              <TimePicker
                id="event-time"
                value={time}
                onChange={(val) => setTime(val)}
                placeholder="Select start time"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="event-place" className="field-label">
                Place
              </label>
              <div className="relative mt-3">
                <MapPin
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="event-place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="event-guest" className="field-label">
                Featured Guest
              </label>
              <div className="relative mt-3">
                <Star
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  id="event-guest"
                  value={featuredGuest}
                  onChange={(e) => setFeaturedGuest(e.target.value)}
                  className={`${inputClass} pl-11`}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-[10rem_1fr]">
            <div className="space-y-3">
              <label htmlFor="event-currency" className="field-label">
                Currency
              </label>
              <ListOptionChooser
                id="event-currency"
                value={currency}
                onChange={(val) => setCurrency(val)}
                options={[
                  { value: "USD", label: "USD ($)" },
                  { value: "GHS", label: "GHS (GH₵)" },
                ]}
              />
            </div>

            <div>
              <label htmlFor="event-price" className="field-label">
                Price (0 for a free event)
              </label>
              <input
                id="event-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={`${inputClass} mt-3`}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <Button asChild type="button" variant="outline" className="rounded-lg">
              <Link to="/manage/events">Cancel</Link>
            </Button>
            <Button type="submit" disabled={updateMut.isPending} className="rounded-lg px-8">
              {updateMut.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
