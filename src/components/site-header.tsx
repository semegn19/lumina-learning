import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";         
import { getMediaUrl } from "@/lib/utils"; 
import { getOrganizationSettings } from "@/lib/organization-api";

export function SiteHeader() {
  const { user } = useAuth();

  const { data: orgSettings } = useQuery({
    queryKey: ["organization-settings"],
    queryFn: () => getOrganizationSettings(),
    staleTime: 10 * 60 * 1000,
  });

  const orgName =
    orgSettings?.organization_name ||
    orgSettings?.name ||
    orgSettings?.title ||
    "Serene Academy";

  const orgLogo = orgSettings?.logo ? getMediaUrl(orgSettings.logo) : null;

  const profileImageUrl = getMediaUrl(user?.profile_picture || user?.avatar);
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ""}`.trim()
    : user?.username || user?.email || "My Profile";

  const initials = user?.first_name
    ? `${user.first_name[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : user?.username
      ? user.username.slice(0, 2).toUpperCase()
      : "U";

  // Route to the logged-in user's profile
  const profileLink = user?.id ? `/users/${user.id}` : "/settings/profile";

  return (
    <header className="w-full border-b border-border/40 bg-canvas/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex w-full items-center justify-between gap-4 px-6 py-3 md:px-8">
        {/* App Name & Logo - routes to /organization */}
        <Link
          to="/organization"
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90 cursor-pointer"
          title={`View ${orgName} profile`}
        >
          {orgLogo ? (
            <img
              src={orgLogo}
              alt={orgName}
              className="size-9 rounded-xl object-cover shadow-sm"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" aria-hidden />
            </div>
          )}
          <span className="font-display text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
            {orgName}
          </span>
        </Link>

        {/* Logged in User Profile Picture Button */}
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              to={profileLink}
              className="group flex items-center gap-2 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-primary/40"
              title={`Logged in as ${displayName} — Click to view profile`}
              aria-label="View your profile"
            >
              <Avatar className="size-10 shrink-0 border-2 border-primary/20 transition-transform group-hover:scale-105 shadow-sm">
                {profileImageUrl ? (
                  <AvatarImage
                    src={profileImageUrl}
                    alt={displayName}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link
              to="/auth/login"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              aria-label="Sign in"
            >
              <Avatar className="size-10 shrink-0 border border-border">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <UserIcon className="size-5" />
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
