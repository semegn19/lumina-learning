import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {             
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { SiteHeader } from "../components/site-header";
import { AppSidebar, MobileNavBar } from "../components/app-sidebar";
import { ChatWidget } from "../components/chat-widget";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "../lib/auth-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lumina Learning — Focused Online Courses" },
      {
        name: "description",
        content:
          "Lumina Learning is a calm, focus-first course platform for tracking progress, teaching, and hiring.",
      },
      { property: "og:title", content: "Lumina Learning" },
      {
        property: "og:description",
        content: "A calm, focus-first course platform for learners and academies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}

/** Renders the shell only after the initial auth check finishes. */
function AppShell() {
  const { isLoading, isAuthenticated } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  const isPublic =
    pathname.startsWith("/auth") ||
    pathname === "/landing" ||
    pathname === "/verify-certificate" ||
    pathname.startsWith("/payment");

  if (isPublic) {
    return (
      <div className="min-h-screen w-full bg-canvas">
        <Outlet />
      </div>
    );
  }

  // Guard protected routes against unauthorized viewing
  if (!isAuthenticated) {
    if (typeof window !== "undefined") {
      if (pathname === "/") {
        window.location.replace("/landing");
      } else {
        window.location.replace("/auth/login");
      }
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-label="Redirecting..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas">
      {/* 1. Global top bar starting from the far left edge */}
      <SiteHeader />

      {/* 2. Main workspace below the top bar: Sidebar on the left, Outlet on the right */}
      <div className="flex min-w-0 flex-1">
        <AppSidebar />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </div>
      </div>

      <MobileNavBar />
      <ChatWidget />
    </div>
  );
}

