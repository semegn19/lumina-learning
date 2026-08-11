import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Banknote,
  RefreshCcw,
  TrendingUp,
  Users,
  UserRoundCheck,
  ArrowRight,
} from "lucide-react";
import { useMemo } from "react";

import { AdminGuard } from "@/components/admin-guard";
import { Button } from "@/components/ui/button";
import { AuditLogItem } from "@/components/audit-log-item";
import {
  getAdminDashboard,
  getAuditLogs,
  buildUserLookupIndex,
} from "@/lib/dashboard-audit-api";
import { getAllUsers } from "@/lib/users-api";
import { formatCurrency } from "@/lib/utils";
import type { AuditLog } from "@/lib/api-types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Overview | Lumina Learning" },
      {
        name: "description",
        content:
          "Platform performance and key metrics at a glance: users, enrollments, revenue and audit logs.",
      },
      { property: "og:title", content: "Admin Overview | Lumina Learning" },
      { property: "og:description", content: "Platform performance and key metrics at a glance." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: () => (
    <AdminGuard>
      <AdminOverview />
    </AdminGuard>
  ),
});

function AdminOverview() {
  // 1. Fetch dashboard metrics and stats (stats, revenue breakdown, user growth)
  const {
    data: dashboard,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => getAdminDashboard(),
  });

  // 2. Fetch all users for resolving user IDs to first_name & last_name
  const { data: usersData } = useQuery({
    queryKey: ["users-all-lookup"],
    queryFn: () => getAllUsers(),
    staleTime: 5 * 60 * 1000,
  });

  // Build comprehensive multi-index lookup (ID, username, email)
  const userIndex = useMemo(() => {
    return buildUserLookupIndex(usersData);
  }, [usersData]);

  // 3. Fetch audit logs (exact same source and method as Audit Logs page)
  const {
    data: auditLogsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ["audit-logs", { page: 1 }],
    queryFn: () => getAuditLogs({ page: 1 }),
  });

  const handleRefresh = async () => {
    await Promise.all([refetchDashboard(), refetchLogs()]);
  };

  // Extract nested stats per exact backend response
  const totalUsers = dashboard?.stats?.total_users ?? dashboard?.total_users ?? 0;
  const activeUsers = dashboard?.stats?.active_users ?? dashboard?.active_users ?? totalUsers;
  const totalEnrollments = dashboard?.stats?.total_enrollments ?? dashboard?.total_enrollments ?? 0;
  const totalRevenue = dashboard?.stats?.total_revenue ?? dashboard?.total_revenue ?? 0;
  const currency = dashboard?.currency || "USD";

  // Revenue breakdown
  const paidCoursesRevenue =
    dashboard?.revenue_breakdown?.paid_courses ??
    dashboard?.revenue_by_source?.paid_courses ??
    dashboard?.paid_courses_revenue ??
    totalRevenue;

  const donationsRevenue =
    dashboard?.revenue_breakdown?.donations ??
    dashboard?.revenue_by_source?.donations ??
    dashboard?.donations_revenue ??
    0;

  const freeCoursesCount =
    dashboard?.revenue_breakdown?.free_courses ??
    dashboard?.revenue_by_source?.free_courses ??
    0;

  // User growth points
  const rawGrowth = dashboard?.user_growth ?? [];
  const growthPoints = rawGrowth.map((g) => {
    const dateStr = g.month || g.date || "";
    let label = dateStr;
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      }
    } catch {
      label = dateStr;
    }
    return {
      label,
      count: Number(g.count ?? g.users ?? 0),
    };
  });

  const maxGrowthCount = Math.max(1, ...growthPoints.map((p) => p.count));

  // Recent activity logs (from audit logs endpoint just like manage.activity.tsx)
  const rawAuditLogs: AuditLog[] = Array.isArray(auditLogsData)
    ? auditLogsData
    : auditLogsData?.results ?? [];

  const activityLogs: AuditLog[] = rawAuditLogs.slice(0, 6);

  const stats = [
    {
      label: "Total Users",
      value: String(totalUsers),
      icon: Users,
      pill: "Platform",
      pillTone: "bg-muted text-muted-foreground",
    },
    {
      label: "Active Users",
      value: String(activeUsers),
      icon: UserRoundCheck,
      pill: "Active",
      pillTone: "bg-success-soft text-success",
    },
    {
      label: "Total Enrollments",
      value: String(totalEnrollments),
      icon: BookOpen,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue, currency),
      icon: Banknote,
    },
  ];

  const revenueBreakdownItems = [
    {
      label: "Paid Courses",
      value: formatCurrency(paidCoursesRevenue, currency),
      tone: "bg-primary",
    },
    {
      label: "Free Courses",
      value: String(freeCoursesCount ?? 0),
      tone: "bg-primary-soft",
    },
    {
      label: "Donations",
      value: formatCurrency(donationsRevenue, currency),
      tone: "bg-success",
    },
  ];

  const isRefreshing = dashboardLoading || logsLoading;

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Admin Overview</h1>
            <p className="mt-2 text-muted-foreground">Platform performance and key metrics at a glance.</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            className="rounded-lg gap-2"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            Refresh Stats
          </Button>
        </div>

        {/* Metric Cards */}
        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="surface-card p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <s.icon className="size-5" aria-hidden />
                </span>
                {s.pill ? (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.pillTone}`}>
                    {s.pill}
                  </span>
                ) : null}
              </div>
              <p className="field-label mt-6 text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold">
                {dashboardLoading ? "..." : s.value}
              </p>
            </div>
          ))}
        </section>

        {/* Growth & Revenue Section */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {/* User Growth Chart */}
          <div className="surface-card p-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">User Growth</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Platform user registrations over time</p>
                </div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                  {totalUsers} Total Registrations
                </span>
              </div>

              {growthPoints.length > 0 ? (
                <div className="mt-8 flex h-52 items-end gap-6 sm:gap-10 pb-4">
                  {growthPoints.map((pt, idx) => {
                    const heightPercent = Math.max(15, Math.round((pt.count / maxGrowthCount) * 100));
                    return (
                      <div key={idx} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
                        <span className="text-xs font-bold text-foreground">
                          {pt.count}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-primary/70 to-primary transition-all hover:opacity-90"
                        />
                        <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px] text-center">
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="my-12 text-center text-muted-foreground">
                  <p className="text-sm">No growth records available yet.</p>
                </div>
              )}
            </div>

            <div className="border-t border-border/70 pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Historical registration trend</span>
              <span className="font-semibold text-foreground">Live from server</span>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="surface-card p-7 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold">Revenue Sources</h2>
              <p className="mt-1 text-sm text-muted-foreground">Income channels distribution</p>
            </div>

            <div className="relative mx-auto my-6 grid size-52 place-items-center">
              <svg viewBox="0 0 100 100" className="size-52 -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-primary-soft)" strokeWidth="14" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="14"
                  strokeDasharray="264"
                  strokeDashoffset={Number(totalRevenue) > 0 ? "0" : "264"}
                />
              </svg>
              <div className="absolute text-center">
                <p className="font-display text-2xl font-bold">
                  {formatCurrency(totalRevenue, currency)}
                </p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>

            <ul className="space-y-3.5">
              {revenueBreakdownItems.map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className={`size-2.5 rounded-full ${r.tone}`} /> {r.label}
                  </span>
                  <span className="font-semibold text-foreground">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Recent Activity / Audit Logs */}
        <section className="surface-card mt-8 p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <p className="mt-1 text-sm text-muted-foreground">Latest audit logs across the platform</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="font-bold text-primary hover:text-primary gap-1.5">
              <Link to="/manage/activity">
                VIEW ALL <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {activityLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No recent activity logs recorded yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {activityLogs.map((a, idx) => (
                <AuditLogItem
                  key={a.id ? `log-${a.id}` : `log-idx-${idx}`}
                  log={a}
                  userIndex={userIndex}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
