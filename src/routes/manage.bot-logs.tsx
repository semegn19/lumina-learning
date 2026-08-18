import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  Check,
  Globe,
  MessageCircle,
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  User,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllBotLogs } from "@/lib/bot-api";
import { getAllUsers } from "@/lib/users-api";
import { buildUserLookupIndex, resolveUserDisplayName } from "@/lib/dashboard-audit-api";
import type { BotLog } from "@/lib/api-types";

const PAGE_SIZE = 9;

export const Route = createFileRoute("/manage/bot-logs")({
  head: () => ({
    meta: [
      { title: "Bot Logs | Lumina Learning Admin" },
      {
        name: "description",
        content: "Review conversation logs, student queries, and automated chatbot responses.",
      },
      { property: "og:title", content: "Bot Logs | Lumina Learning Admin" },
      { property: "og:description", content: "Review conversation logs and chatbot inquiries." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/bot-logs" }],
  }),
  component: () => (
    <AdminGuard>
      <ManageBotLogs />
    </AdminGuard>
  ),
});

function matchesPlatform(log: BotLog, filter: string): boolean {
  if (filter === "ALL") return true;
  const p = String(log.platform || log.channel || "WB").trim().toUpperCase();

  if (filter === "Web") {
    return p === "WB" || p.includes("WEB");
  }
  if (filter === "Telegram") {
    return p === "TG" || p.includes("TELEGRAM");
  }
  if (filter === "WhatsApp") {
    return p === "WA" || p.includes("WHATSAPP");
  }
  return true;
}

function getPlatformBadge(platform?: string, channel?: string) {
  const p = String(platform || channel || "WB").trim().toUpperCase();
  if (p === "TG" || p.includes("TELEGRAM")) {
    return {
      label: "Telegram",
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    };
  }
  if (p === "WA" || p.includes("WHATSAPP")) {
    return {
      label: "WhatsApp",
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    };
  }
  return {
    label: "Web Chat",
    tone: "bg-primary/10 text-primary border-primary/20",
  };
}

function ManageBotLogs() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [expandedLogId, setExpandedLogId] = useState<string | number | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // 1. Fetch ALL bot conversation logs across all backend pages
  const { data: allLogs = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["bot-logs-all"],
    queryFn: () => getAllBotLogs(),
  });

  // 2. Fetch users for resolving user display names
  const { data: usersData } = useQuery({
    queryKey: ["users-all-lookup"],
    queryFn: () => getAllUsers(),
    staleTime: 5 * 60 * 1000,
  });

  const userIndex = useMemo(() => {
    return buildUserLookupIndex(usersData);
  }, [usersData]);

  // 3. Filter logs across all items by platform and search keywords
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      // Platform check
      if (!matchesPlatform(log, platformFilter)) return false;

      // Search check
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const userQ = String(log.question || log.user_message || log.message || "").toLowerCase();
        const botR = String(log.response || log.bot_response || log.reply || log.answer || "").toLowerCase();
        const uName = String(log.user_name || "").toLowerCase();
        const uEmail = String(log.user_email || "").toLowerCase();
        const pStr = String(log.platform || log.channel || "").toLowerCase();

        return (
          userQ.includes(q) ||
          botR.includes(q) ||
          uName.includes(q) ||
          uEmail.includes(q) ||
          pStr.includes(q)
        );
      }

      return true;
    });
  }, [allLogs, platformFilter, search]);

  // 4. Client pagination over the filtered results
  const totalItems = filteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  // Current page records
  const displayLogs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredLogs.slice(start, start + PAGE_SIZE);
  }, [filteredLogs, page]);

  const handlePlatformChange = (p: string) => {
    setPlatformFilter(p);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCopy = (text: string, id: string | number) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Text copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const platforms = ["ALL", "Web", "Telegram", "WhatsApp"];

  // Generate pagination buttons window
  const paginationPages = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 7;
    let start = Math.max(1, page - 3);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-canvas-rose/40">
      <main className="mx-auto max-w-[1200px] px-6 py-8 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bot className="size-5" aria-hidden />
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Bot Conversation Logs
                </h1>
                <p className="mt-1 text-base text-muted-foreground">
                  Monitor student questions and automated chatbot responses across Web, Telegram, and WhatsApp.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="gap-2 rounded-xl"
          >
            <RefreshCcw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        </div>

        {/* Stats Strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="surface-card flex items-center gap-4 p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <MessageCircle className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Interactions
              </p>
              <p className="text-2xl font-bold text-foreground">{allLogs.length}</p>
            </div>
          </div>

          <div className="surface-card flex items-center gap-4 p-5">
            <span className="grid size-12 place-items-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Send className="size-6" />
            </span>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Supported Platforms
              </p>
              <p className="text-2xl font-bold text-foreground">Web, Telegram, WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {/* Platform Pills */}
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs">
            {platforms.map((p) => {
              const active = platformFilter === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePlatformChange(p)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[280px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search user questions, responses, or names..."
              className="h-10 rounded-xl bg-card pl-10 text-xs shadow-xs"
            />
          </div>
        </div>

        {/* Logs List */}
        <div className="mt-6">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading bot conversation logs...</p>
            </div>
          ) : displayLogs.length === 0 ? (
            <div className="surface-card py-16 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
                <MessageSquare className="size-8" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">
                {search || platformFilter !== "ALL"
                  ? "No matching conversation logs found"
                  : "No bot conversation logs recorded yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || platformFilter !== "ALL"
                  ? "Try clearing filters or search keywords."
                  : "When users chat with the bot on the website, Telegram, or WhatsApp, their conversations will appear here."}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {displayLogs.map((log, idx) => {
                const logId = log.id || `bot-log-${idx}`;
                const isExpanded = expandedLogId === logId;
                const platformInfo = getPlatformBadge(log.platform, log.channel);

                const userInfo = resolveUserDisplayName(
                  log,
                  userIndex,
                  log.user_email,
                  log.user_name
                );

                const userQuestion =
                  log.question || log.user_message || log.message || "No question text recorded";
                const botResponse =
                  log.response || log.bot_response || log.reply || log.answer || "No response recorded";
                const timestampStr = log.created_at || log.timestamp || log.created;

                let dateDisplay = "Recent";
                if (timestampStr) {
                  try {
                    const d = new Date(timestampStr);
                    if (!isNaN(d.getTime())) {
                      dateDisplay = d.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    }
                  } catch {
                    dateDisplay = String(timestampStr);
                  }
                }

                return (
                  <li
                    key={logId}
                    onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                    className="surface-card group overflow-hidden p-6 transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-md cursor-pointer"
                  >
                    {/* Top Row: Meta info */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-bold transition-transform duration-300 group-hover:scale-105 ${platformInfo.tone}`}
                        >
                          <Globe className="size-3" />
                          {platformInfo.label}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <User className="size-3.5 text-primary" />
                          {userInfo.userId ? (
                            <Link
                              to="/users/$userId"
                              params={{ userId: String(userInfo.userId) }}
                              onClick={(e) => e.stopPropagation()}
                              className="group-hover:text-primary transition-colors underline-offset-2 hover:underline"
                            >
                              {userInfo.name}
                            </Link>
                          ) : (
                            <span className="group-hover:text-primary transition-colors">{userInfo.name || "Anonymous Visitor"}</span>
                          )}
                          {userInfo.email && (
                            <span className="text-muted-foreground font-normal">
                              ({userInfo.email})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        <span>{dateDisplay}</span>
                      </div>
                    </div>

                    {/* Chat Content Preview */}
                    <div className="mt-4 space-y-3 text-sm">
                      {/* User Message */}
                      <div className="flex items-start gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-bold transition-transform duration-300 group-hover:scale-105">
                          U
                        </span>
                        <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-2.5 text-foreground leading-relaxed">
                          <p className="font-medium">{userQuestion}</p>
                        </div>
                      </div>

                      {/* Bot Message */}
                      <div className="flex items-start gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary text-xs font-bold transition-transform duration-300 group-hover:scale-105">
                          <Bot className="size-4" />
                        </span>
                        <div className="flex-1 rounded-2xl rounded-tl-sm bg-primary/5 border border-primary/15 px-4 py-2.5 text-foreground/90 leading-relaxed">
                          <p className="whitespace-pre-wrap">{botResponse}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Expanded Meta */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopy(`User: ${userQuestion}\nBot: ${botResponse}`, logId)
                          }
                          className="h-7 gap-1 px-2 text-xs"
                        >
                          {copiedId === logId ? (
                            <>
                              <Check className="size-3 text-success" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" /> Copy Conversation
                            </>
                          )}
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedLogId(isExpanded ? null : logId)}
                        className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <span>{isExpanded ? "Hide Details" : "Inspect Raw Meta"}</span>
                        {isExpanded ? (
                          <ChevronUp className="size-3.5" />
                        ) : (
                          <ChevronDown className="size-3.5" />
                        )}
                      </Button>
                    </div>

                    {/* Detailed inspection drawer */}
                    {isExpanded && (
                      <div className="mt-3 rounded-xl border border-border/70 bg-card/60 p-4 text-xs font-mono text-muted-foreground">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <p>
                            <span className="font-bold text-foreground">Log ID:</span>{" "}
                            {String(log.id ?? "N/A")}
                          </p>
                          <p>
                            <span className="font-bold text-foreground">Session ID:</span>{" "}
                            {log.session_id || "N/A"}
                          </p>
                          <p>
                            <span className="font-bold text-foreground">IP Address:</span>{" "}
                            {log.ip_address || log.ip || "N/A"}
                          </p>
                          <p>
                            <span className="font-bold text-foreground">Platform Code:</span>{" "}
                            {log.platform || log.channel || "WB"}
                          </p>
                        </div>

                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-3 border-t border-border pt-2">
                            <p className="font-bold text-foreground mb-1">Metadata:</p>
                            <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[11px]">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(totalItems, (page - 1) * PAGE_SIZE + 1)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground">
                  {Math.min(totalItems, page * PAGE_SIZE)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{totalItems}</span> conversation
                logs
              </p>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="gap-1 rounded-lg px-2.5 text-xs font-semibold"
                >
                  <ChevronLeft className="size-4" /> Previous
                </Button>

                {paginationPages.map((pg) => (
                  <Button
                    key={pg}
                    variant={page === pg ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pg)}
                    className="size-8 rounded-lg p-0 text-xs font-semibold"
                  >
                    {pg}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="gap-1 rounded-lg px-2.5 text-xs font-semibold"
                >
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
