import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Search,
  ArrowLeft,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { AuditLogItem } from "@/components/audit-log-item";
import { ListOptionChooser } from "@/components/ui/list-option-chooser";
import {
  getAllAuditLogs,
  getAuditLogTag,
  buildUserLookupIndex,
  resolveUserDisplayName,
  formatAuditLogDetails,
  type AuditTag,
} from "@/lib/dashboard-audit-api";
import { getAllUsers } from "@/lib/users-api";
import type { AuditLog } from "@/lib/api-types";

export const Route = createFileRoute("/manage/activity")({
  head: () => ({
    meta: [
      { title: "Audit Logs & Activity | Lumina Learning" },
      {
        name: "description",
        content: "Browse, search and filter audit log entries recorded across the Lumina Learning platform.",
      },
      { property: "og:title", content: "Audit Logs & Activity | Lumina Learning" },
      { property: "og:description", content: "Search and filter platform audit log entries." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/activity" }],
  }),
  component: () => (
    <AdminGuard>
      <ActivityLog />
    </AdminGuard>
  ),
});

const tags: (AuditTag | "ALL")[] = [
  "ALL",
  "LOGIN",
  "PURCHASE",
  "UPDATE",
  "ENROLL",
  "SIGNUP",
  "DELETE",
  "ACTIVITY",
];

const PAGE_SIZE = 9;

function ActivityLog() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tag, setTag] = useState<AuditTag | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Debounce search input and reset page
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(query.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // 1. Fetch all audit logs across all pages
  const { data: allLogs = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["all-audit-logs"],
    queryFn: () => getAllAuditLogs(),
    staleTime: 60 * 1000,
  });

  // 2. Fetch users list for multi-index user resolution
  const { data: usersData } = useQuery({
    queryKey: ["users-all-lookup"],
    queryFn: () => getAllUsers(),
    staleTime: 5 * 60 * 1000,
  });

  const userIndex = useMemo(() => {
    return buildUserLookupIndex(usersData);
  }, [usersData]);

  const isBusy = isLoading || isRefetching || isManualRefreshing;

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["all-audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["users-all-lookup"] }),
      ]);
      toast.success("Audit logs refreshed");
    } catch {
      toast.error("Failed to refresh audit logs");
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 500);
    }
  };

  // Filter across ALL total items in the dataset
  const filtered = useMemo(() => {
    return allLogs.filter((r) => {
      // If tag filter is active, match action category
      const tagInfo = getAuditLogTag(r.action);
      const matchesTag = tag === "ALL" || tagInfo.tag === tag;
      if (!matchesTag) return false;

      // If search text is active, match user name, email, action, details or tag
      if (debouncedSearch) {
        const userInfo = resolveUserDisplayName(r, userIndex, r.user_email, r.user_name);
        const userStr = `${userInfo.name} ${userInfo.email || ""}`.toLowerCase();
        const actionStr = (r.action || "").toLowerCase();
        const detailsStr = formatAuditLogDetails(r.details || r.ip_address || r.ip).toLowerCase();
        const tagStr = (tagInfo.tag || "").toLowerCase();
        const q = debouncedSearch.toLowerCase();
        return (
          userStr.includes(q) ||
          actionStr.includes(q) ||
          detailsStr.includes(q) ||
          tagStr.includes(q)
        );
      }

      return true;
    });
  }, [allLogs, tag, debouncedSearch, userIndex]);

  // Paginate the filtered logs (9 items per page)
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginatedLogs = useMemo(() => {
    return filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  }, [filtered, safePage]);

  // Generate pagination buttons window around safePage
  const paginationPages = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 7;
    let start = Math.max(1, safePage - 3);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [safePage, totalPages]);

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-2"
            >
              <ArrowLeft className="size-4" aria-hidden /> Back to Overview
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Audit Logs & Activity
            </h1>
            <p className="mt-2 text-muted-foreground">
              Detailed logs of all user actions, transactions, and system updates ({allLogs.length} total logs).
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl gap-2 active:scale-95 transition-all shadow-xs hover:bg-accent hover:text-foreground cursor-pointer"
            disabled={isBusy}
            title="Refresh audit logs"
          >
            <RefreshCcw
              className={`size-3.5 transition-transform duration-300 ${
                isBusy ? "animate-spin text-primary" : ""
              }`}
              aria-hidden
            />
            <span>{isBusy ? "Refreshing..." : "Refresh Logs"}</span>
          </Button>
        </div>

        <section className="surface-card mt-8 p-7">
          {/* Search and Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search across all audit logs by user, action, or details..."
                aria-label="Search activity"
                className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="w-52">
              <ListOptionChooser
                ariaLabel="Filter by action type"
                value={tag}
                onChange={(val) => {
                  setTag(val as AuditTag | "ALL");
                  setPage(1);
                }}
                options={tags.map((t) => ({
                  value: t,
                  label: t === "ALL" ? "All action types" : t,
                }))}
              />
            </div>
          </div>

          {/* Active Filter Summary */}
          {(tag !== "ALL" || debouncedSearch) && (
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-accent/40 px-4 py-2 text-xs text-muted-foreground">
              <span>
                Found <strong className="text-foreground">{totalFiltered}</strong> matching log
                {totalFiltered === 1 ? "" : "s"}{" "}
                {tag !== "ALL" ? (
                  <>
                    for action <strong className="text-primary font-bold">{tag}</strong>
                  </>
                ) : null}
                {debouncedSearch ? (
                  <>
                    {" "}
                    matching <strong className="text-foreground">"{debouncedSearch}"</strong>
                  </>
                ) : null}
              </span>
              <button
                onClick={() => {
                  setTag("ALL");
                  setQuery("");
                  setPage(1);
                }}
                className="font-medium text-primary hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}

          {/* Logs List */}
          {isLoading ? (
            <div className="py-20 flex justify-center">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : totalFiltered === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-base font-semibold">No audit logs found</p>
              <p className="mt-1 text-sm">
                No activity records match your filter criteria ({tag !== "ALL" ? tag : query}).
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTag("ALL");
                  setQuery("");
                  setPage(1);
                }}
                className="mt-4 rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {paginatedLogs.map((a, idx) => (
                <AuditLogItem
                  key={a.id ? `audit-${a.id}` : `audit-row-${(safePage - 1) * PAGE_SIZE + idx}`}
                  log={a}
                  userIndex={userIndex}
                />
              ))}
            </ul>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">
                Showing <strong className="text-foreground">{(safePage - 1) * PAGE_SIZE + 1}</strong>
                –
                <strong className="text-foreground">
                  {Math.min(safePage * PAGE_SIZE, totalFiltered)}
                </strong>{" "}
                of <strong className="text-foreground">{totalFiltered}</strong> matching entries (
                {allLogs.length} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="size-9 rounded-lg p-0"
                  aria-label="Previous page"
                  disabled={safePage <= 1 || isLoading}
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>

                {paginationPages.length > 0 && paginationPages[0]! > 1 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="flex size-9 items-center justify-center rounded-lg text-sm text-muted-foreground hover:bg-muted"
                    >
                      1
                    </button>
                    {paginationPages[0]! > 2 && <span className="text-muted-foreground px-1">...</span>}
                  </>
                )}

                {paginationPages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={isLoading}
                    className={`flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === safePage
                        ? "bg-accent font-bold text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                {paginationPages.length > 0 &&
                  paginationPages[paginationPages.length - 1]! < totalPages && (
                    <>
                      {paginationPages[paginationPages.length - 1]! < totalPages - 1 && (
                        <span className="text-muted-foreground px-1">...</span>
                      )}
                      <button
                        onClick={() => setPage(totalPages)}
                        className="flex size-9 items-center justify-center rounded-lg text-sm text-muted-foreground hover:bg-muted"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                <Button
                  variant="outline"
                  className="size-9 rounded-lg p-0"
                  aria-label="Next page"
                  disabled={safePage >= totalPages || isLoading}
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
