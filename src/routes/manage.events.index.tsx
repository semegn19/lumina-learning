import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Eye, MoreVertical, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteEvent, getEvents } from "@/lib/events-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatPrice } from "@/lib/utils";
import type { EventItem, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/manage/events/")({
  head: () => ({
    meta: [
      { title: "Manage Events | Lumina Learning" },
      {
        name: "description",
        content: "Review, edit and cancel the workshops, symposiums and masterclasses you host.",
      },
      { property: "og:title", content: "Manage Events | Lumina Learning" },
      { property: "og:description", content: "Review, edit and cancel the events you host." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/events" }],
  }),
  component: () => (
    <AdminGuard>
      <ManageEvents />
    </AdminGuard>
  ),
});

function ManageEvents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<EventItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await getEvents();
      return res;
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number | string) => {
      await deleteEvent(id);
    },
    onSuccess: () => {
      toast.success("Event deleted successfully");
      void queryClient.invalidateQueries({ queryKey: ["events"] });
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error(`Failed to delete event: ${getApiErrorMessage(err)}`);
    },
  });

  let rawList: EventItem[] = [];
  if (data) {
    if (Array.isArray(data)) {
      rawList = data;
    } else {
      rawList = (data as PaginatedResponse<EventItem>).results ?? [];
    }
  }

  const visible = query.trim()
    ? rawList.filter((e) =>
        `${e.title} ${e.place || ""} ${e.description || ""} ${e.date || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
      )
    : rawList;

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              My Events
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage the workshops, webinars, and live sessions you host.
            </p>
          </div>
          <Button asChild className="gap-2 rounded-lg px-6">
            <Link to="/events/new">
              <Plus className="size-4" aria-hidden /> Create Event
            </Link>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-8 max-w-md">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scheduled events…"
            aria-label="Search scheduled events"
            className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center text-destructive">
            Failed to load events. Ensure you have administrator permissions.
          </div>
        ) : visible.length === 0 ? (
          <div className="surface-card mt-8 grid place-items-center gap-3 p-16 text-center">
            <CalendarDays className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-lg font-semibold">
              {query ? `No events match "${query}"` : "No events scheduled"}
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different search query, or create a new event.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {visible.map((e) => {
              const priceText = formatPrice(e.price, e.currency);

              return (
                <li
                  key={e.id}
                  onClick={() =>
                    navigate({
                      to: "/events/$eventId",
                      params: { eventId: String(e.id) },
                    })
                  }
                  className="surface-card group flex flex-wrap items-center gap-5 p-6 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-md cursor-pointer"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-105">
                    <CalendarDays className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-[200px] flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold group-hover:text-primary transition-colors">
                        {e.title}
                      </h2>
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                        {priceText}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {e.place || "Online"} · {e.date}
                    </p>
                    {e.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {e.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                    <Button asChild variant="outline" className="gap-2 rounded-lg">
                      <Link to="/manage/events/$eventId/attendees" params={{ eventId: String(e.id) }}>
                        <Users className="size-4" aria-hidden /> Attendees
                      </Link>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${e.title}`}
                        className="rounded-lg p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="size-5" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/events/$eventId" params={{ eventId: String(e.id) }}>
                            <Eye className="size-4" aria-hidden /> View event
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/manage/events/$eventId/edit" params={{ eventId: String(e.id) }}>
                            <Pencil className="size-4" aria-hidden /> Edit event
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={() => setPendingDelete(e)}
                        >
                          <Trash2 className="size-4" aria-hidden /> Delete event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. “{pendingDelete?.title}” and all registration records will
              be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!pendingDelete) return;
                deleteMut.mutate(pendingDelete.id);
              }}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
