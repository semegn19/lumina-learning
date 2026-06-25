import { Link, useRouterState } from "@tanstack/react-router";
import {         
  Activity,
  BookOpen,
  Bot,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  LibraryBig,
  LogOut,
  Percent,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

import { useAuth, isAdmin } from "@/lib/auth-context";

// 1. Regular User / Student navigation items (Only pages accessible to students)
const userNavItems = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/my-learning", label: "My Learning", icon: BookOpen },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/certificates", label: "Certificates", icon: FileText },
  { to: "/discounts", label: "Discounts", icon: Tag },
  { to: "/organization", label: "Organization", icon: Building2 },
];

// 2. Admin navigation items (Only admin management tools)
const adminNavItems = [
  { to: "/admin", label: "Admin Overview", icon: ShieldCheck },
  { to: "/users", label: "User Management", icon: Users },
  { to: "/manage/courses", label: "Manage Courses", icon: LibraryBig },
  { to: "/manage/events", label: "Manage Events", icon: CalendarDays },
  { to: "/manage/jobs", label: "Manage Jobs", icon: BriefcaseBusiness },
  { to: "/manage/discounts", label: "Manage Discounts", icon: Percent },
  { to: "/manage/faqs", label: "Bot FAQs", icon: HelpCircle },
  { to: "/manage/bot-logs", label: "Bot Logs", icon: Bot },
  { to: "/manage/activity", label: "Audit Logs", icon: Activity },
  { to: "/settings/organization", label: "Organization Settings", icon: Building2 },
];

function SidebarLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`group/link flex h-10 w-full items-center gap-3 rounded-xl px-2.5 transition-all duration-200 ${
        active
          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
          : "text-foreground/75 hover:bg-primary-soft hover:text-primary"
      }`}
    >
      <Icon
        className="size-5 shrink-0 transition-transform duration-200 group-hover/link:scale-110"
        aria-hidden
      />
      <span className="truncate text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap overflow-hidden">
        {label}
      </span>
    </Link>
  );
}

function MobileLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`group flex size-11 items-center justify-center rounded-full transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-xs scale-105"
          : "text-foreground/75 hover:bg-primary-soft hover:text-primary"
      }`}
    >
      <Icon className="size-5" aria-hidden />
    </Link>
  );
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout } = useAuth();
  const isUserAdmin = isAdmin(user?.role as any);

  // Don't render the sidebar on auth pages or landing
  if (pathname.startsWith("/auth") || pathname === "/landing") return null;

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    if (to === "/organization") return pathname === "/organization";
    if (to === "/settings/organization") return pathname.startsWith("/settings/organization");
    if (to === "/courses") {
      return (
        (pathname === "/courses" || (pathname.startsWith("/courses/") && pathname !== "/courses/new")) &&
        !pathname.startsWith("/manage")
      );
    }
    if (to === "/events") {
      return (
        (pathname === "/events" || (pathname.startsWith("/events/") && pathname !== "/events/new")) &&
        !pathname.startsWith("/manage")
      );
    }
    if (to === "/jobs") {
      return (
        (pathname === "/jobs" || (pathname.startsWith("/jobs/") && pathname !== "/jobs/new")) &&
        !pathname.startsWith("/manage")
      );
    }
    if (to === "/discounts") {
      return (
        (pathname === "/discounts" || pathname.startsWith("/discounts/")) &&
        !pathname.startsWith("/manage")
      );
    }
    return pathname.startsWith(to);
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth/login";
  };

  const navItems = isUserAdmin ? adminNavItems : userNavItems;

  return (
    <aside className="group/sidebar sticky top-[65px] z-30 hidden h-[calc(100vh-65px)] w-[76px] hover:w-[246px] shrink-0 p-3 transition-[width] duration-300 ease-in-out md:block">
      <nav
        aria-label="Main"
        className="flex h-full w-full flex-col justify-between overflow-y-auto overflow-x-hidden rounded-2xl border border-border/60 bg-canvas-rose/95 py-3 px-1.5 shadow-xs backdrop-blur-md transition-[box-shadow,border-color] duration-300 ease-in-out scrollbar-none group-hover/sidebar:shadow-xl group-hover/sidebar:border-border"
      >
        {/* Navigation list */}
        <div className="flex flex-col items-start gap-1 w-full">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} active={isActive(item.to)} />
          ))}
        </div>

        {/* Bottom logout section */}
        <div className="flex flex-col items-start gap-2 pt-2 w-full">
          <span className="h-px w-full bg-border/60 transition-all duration-300" />
          <button
            onClick={handleLogout}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-full items-center gap-3 rounded-xl px-2.5 text-foreground/75 transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span className="truncate text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 delay-75 whitespace-nowrap overflow-hidden">
              Sign out
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
}

export function MobileNavBar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user?.role as any);

  if (pathname.startsWith("/auth") || pathname === "/landing") return null;

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  const navItems = isUserAdmin ? adminNavItems.slice(0, 5) : userNavItems.slice(0, 5);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card px-2 py-2 md:hidden"
    >
      {navItems.map((item) => (
        <MobileLink key={item.to} {...item} active={isActive(item.to)} />
      ))}
    </nav>
  );
}
