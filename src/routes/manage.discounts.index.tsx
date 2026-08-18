import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MoreVertical, Pencil, Percent, Plus, Search, Tag, Trash2 } from "lucide-react";
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
import { deleteDiscount, getDiscounts } from "@/lib/discounts-api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { DiscountItem, PaginatedResponse } from "@/lib/api-types";
import { discountList } from "@/lib/data";

export const Route = createFileRoute("/manage/discounts/")({
  head: () => ({
    meta: [
      { title: "Manage Discounts | Lumina Learning" },
      { name: "description", content: "Review, edit and remove the course discount codes you have created." },
      { property: "og:title", content: "Manage Discounts | Lumina Learning" },
      { property: "og:description", content: "Review, edit and remove your course discount codes." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/discounts" }],
  }),
  component: () => (
    <AdminGuard>
      <ManageDiscounts />
    </AdminGuard>
  ),
});

function ManageDiscounts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<DiscountItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["discounts", query],
    queryFn: () => getDiscounts({ search: query.trim() || undefined }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number | string) => {
      await deleteDiscount(id);
    },
    onSuccess: () => {
      toast.success("Successfully deleted discount");
      setPending(null);
      void queryClient.invalidateQueries({ queryKey: ["discounts"] });
    },
    onError: (err) => {
      toast.error(`Failed to delete discount: ${getApiErrorMessage(err)}`);
    },
  });

  let fetchedList: DiscountItem[] = [];
  if (data) {
    if (Array.isArray(data)) {
      fetchedList = data;
    } else {
      const paginated = data as PaginatedResponse<DiscountItem>;
      fetchedList = paginated.results ?? [];
    }
  }

  const visible = fetchedList;

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Course Discounts</h1>
            <p className="mt-2 text-muted-foreground">Create and manage the promotional codes for your catalogue.</p>
          </div>
          <Button asChild className="gap-2 rounded-lg px-6">
            <Link to="/manage/discounts/new">
              <Plus className="size-4" aria-hidden /> New Discount
            </Link>
          </Button>
        </div>

        <div className="relative mt-8 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or code…"
            aria-label="Search discounts"
            className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {isLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError && visible.length === 0 ? (
          <div className="surface-card mt-8 grid place-items-center gap-3 p-16 text-center text-destructive">
            <p className="text-lg font-semibold">Failed to load discounts</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="surface-card mt-8 grid place-items-center gap-3 p-16 text-center">
            <Tag className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-lg font-semibold">No discounts found</p>
            <p className="text-sm text-muted-foreground">Create a discount to start running a promotion.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((d) => (
              <article
                key={d.id}
                onClick={() =>
                  navigate({
                    to: "/manage/discounts/$discountId",
                    params: { discountId: String(d.id) },
                  })
                }
                className="surface-card group flex flex-col p-6 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-md cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-105">
                    <Percent className="size-5" aria-hidden />
                  </span>
                  <div onClick={(ev) => ev.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`Actions for ${d.title}`}
                        className="rounded-lg p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreVertical className="size-5" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to="/manage/discounts/$discountId" params={{ discountId: String(d.id) }}>
                            <Tag className="size-4 text-primary" aria-hidden /> View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/manage/discounts/$discountId/edit" params={{ discountId: String(d.id) }}>
                            <Pencil className="size-4" aria-hidden /> Edit discount
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onSelect={() => setPending(d)}>
                          <Trash2 className="size-4" aria-hidden /> Delete discount
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h2 className="mt-4 text-xl font-bold group-hover:text-primary transition-colors">
                  {d.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{d.description}</p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-lg border border-dashed border-primary/50 px-3 py-1.5 font-mono text-sm font-semibold text-primary">
                    {d.code}
                  </span>
                  <span className="text-2xl font-semibold text-primary">
                    {d.percentage ?? d.discount_percentage ?? 0}%
                  </span>
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" aria-hidden /> Ends {d.end_date ? new Date(d.end_date).toLocaleDateString() : "Ongoing"}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can't be undone. The discount “{pending?.title}” will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMut.isPending}
              onClick={() => {
                if (!pending) return;
                deleteMut.mutate(pending.id);
              }}
            >
              {deleteMut.isPending ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
