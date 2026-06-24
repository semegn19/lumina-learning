import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft, GraduationCap } from "lucide-react";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";     

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <span
          className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
          aria-label="Loading"
        />
      </div>
    );
  }

  // If unauthenticated or role is not admin (Master Admin or Secondary Admin)
  if (!isAuthenticated || !isAdmin(user?.role as any)) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <main className="flex-1 flex items-center justify-center px-6 pb-24 pt-12">
          <div className="surface-card max-w-md w-full p-8 text-center shadow-lg border border-border">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4">
              <ShieldAlert className="size-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Access Restricted</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              This management area requires administrator privileges. You do not have permission to view or modify these settings.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline" className="gap-1.5 rounded-lg">
                <Link to="/">
                  <ArrowLeft className="size-4" aria-hidden /> Back to Dashboard
                </Link>
              </Button>
              <Button asChild className="gap-1.5 rounded-lg">
                <Link to="/courses">
                  <GraduationCap className="size-4" aria-hidden /> Browse Courses
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
