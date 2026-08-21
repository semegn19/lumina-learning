import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, ImagePlus, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { ListOptionChooser } from "@/components/ui/list-option-chooser";
import { createEvent } from "@/lib/events-api";
import { getApiErrorMessage } from "@/lib/api-client";

export const Route = createFileRoute("/events/new")({
  head: () => ({
    meta: [
      { title: "Create New Event | Lumina Learning" },
      {
        name: "description",
        content: "Schedule a new learning session — set the cover, date, location, featured guest and pricing.",
      },
      { property: "og:title", content: "Create New Event | Lumina Learning" },
      { property: "og:description", content: "Fill in the details to schedule a new learning session." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/events/new" }],
  }),
  component: () => (
    <AdminGuard>
      <CreateEvent />
    </AdminGuard>
  ),
});

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30";

function CreateEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [featuredGuest, setFeaturedGuest] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required");
      if (!description.trim()) throw new Error("Description is required");
      if (!date) throw new Error("Event date is required");

      // Aggregate date and time into ISO 8601 string for backend
      const isoDateTime = time ? `${date}T${time}:00Z` : `${date}T00:00:00Z`;

      return await createEvent({
        title,
        description,
        date: isoDateTime,
        place: place.trim() || "Online",
        featured_guest: featuredGuest.trim() || undefined,
        price: price.trim() !== "" ? parseFloat(price) : 0,
        currency,
        picture: imageFile,
        image: imageFile,
      });
    },
    onSuccess: (newEvent) => {
      toast.success("Event created successfully!");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      void navigate({ to: "/events/$eventId", params: { eventId: String(newEvent.id) } });
    },
    onError: (err) => {
      toast.error(`Failed to create event: ${getApiErrorMessage(err)}`);
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[880px] px-6 py-8 md:px-8">
        <h1 className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Create New Event</h1>
        <p className="mt-3 text-center text-muted-foreground">
          Fill in the details to schedule a new learning session.
        </p>

        <form
          className="surface-card mt-10 space-y-7 p-9"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <div>
            <p className="field-label">Event Cover Picture</p>
            <label className="mt-3 flex h-48 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-primary/40 text-center transition-colors hover:bg-primary-soft/40">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <>
                  <ImagePlus className="size-6 text-muted-foreground" aria-hidden />
                  <span className="text-sm">Drag and drop an image, or click to browse</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    1200 x 630px recommended (JPG, PNG)
                  </span>
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
              placeholder="e.g. Masterclass: Advanced UI Design"
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
              className="mt-3 w-full rounded-xl border border-input bg-card p-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
              placeholder="Provide a brief overview of what attendees will learn…"
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
                Place / Location
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
                  placeholder="Online or Physical Location"
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
                  placeholder="e.g. Elena Rostova"
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

          <div className="flex justify-end gap-3 border-t border-border pt-7">
            <Button asChild variant="outline" className="rounded-lg px-7">
              <Link to="/events">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createMut.isPending} className="rounded-lg px-7">
              {createMut.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
