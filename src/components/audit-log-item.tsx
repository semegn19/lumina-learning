import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {             
  Banknote,
  BookOpen,
  ChevronDown,
  ChevronUp,
  LogIn,
  RefreshCcw,
  Trash2,
  UserPlus,
  Activity as ActivityIcon,
  User,
  Globe,
  Clock,
  Info,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  resolveUserDisplayName,
  formatAuditLogDate,
  formatAuditLogDetails,
  getAuditLogTag,
  type AuditTag,
  type UserLookupIndex,
} from "@/lib/dashboard-audit-api";
import { getUserById } from "@/lib/users-api";
import { getMediaUrl } from "@/lib/utils";
import type { AuditLog, AuthUser } from "@/lib/api-types";

const iconForTag: Record<AuditTag, typeof LogIn> = {
  LOGIN: LogIn,
  PURCHASE: Banknote,
  UPDATE: RefreshCcw,
  ENROLL: BookOpen,
  SIGNUP: UserPlus,
  DELETE: Trash2,
  ACTIVITY: ActivityIcon,
};

interface AuditLogItemProps {
  log: AuditLog;
  userIndex?: UserLookupIndex | Map<number, AuthUser> | Record<number, AuthUser> | null;
  userMap?: UserLookupIndex | Map<number, AuthUser> | Record<number, AuthUser> | null;
  defaultExpanded?: boolean;
}

export function AuditLogItem({
  log,
  userIndex,
  userMap,
  defaultExpanded = false,
}: AuditLogItemProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const lookupContext = userIndex ?? userMap;
  const initialInfo = resolveUserDisplayName(log, lookupContext, log.user_email, log.user_name);
  const userId = initialInfo.userId;

  // If user name is missing or is just a fallback "User #...", fetch user by ID directly
  const needsFetch = !!userId && (!initialInfo.name || initialInfo.name.startsWith("User #"));

  const { data: fetchedUser } = useQuery({
    queryKey: ["user-lookup", userId],
    queryFn: () => getUserById(userId!),
    enabled: needsFetch,
    staleTime: 5 * 60 * 1000,
  });

  const userInfo = useMemo(() => {
    if (fetchedUser) {
      const fullName = `${fetchedUser.first_name || ""} ${fetchedUser.last_name || ""}`.trim();
      return {
        name: fullName || fetchedUser.username || fetchedUser.email || initialInfo.name,
        email: fetchedUser.email || initialInfo.email,
        avatar: getMediaUrl(fetchedUser.profile_picture || fetchedUser.avatar) || initialInfo.avatar,
        userId: fetchedUser.id || initialInfo.userId,
      };
    }
    return initialInfo;
  }, [fetchedUser, initialInfo]);

  const tagInfo = getAuditLogTag(log.action);
  const IconComponent = iconForTag[tagInfo.tag] || ActivityIcon;
  const detailsText = formatAuditLogDetails(log.details || log.ip_address || log.ip);
  const dateDisplay = formatAuditLogDate(log.created || log.created_at || log.timestamp);

  const initials = userInfo.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <li
      onClick={() => setExpanded(!expanded)}
      className="group py-4 px-4 rounded-xl border border-transparent transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 hover:shadow-xs cursor-pointer"
    >
      {/* Row Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Avatar + Name + Action */}
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <Avatar className="size-10 shrink-0 border border-border/80 transition-transform duration-300 group-hover:scale-105">
            {userInfo.avatar ? (
              <AvatarImage src={userInfo.avatar} alt={userInfo.name} className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {userId ? (
                <Link
                  to="/users/$userId"
                  params={{ userId: String(userId) }}
                  onClick={(e) => e.stopPropagation()}
                  className="truncate font-semibold text-foreground group-hover:text-primary transition-colors"
                >
                  {userInfo.name}
                </Link>
              ) : (
                <span className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                  {userInfo.name}
                </span>
              )}

              {userInfo.email && (
                <span className="hidden text-xs text-muted-foreground sm:inline-block">
                  ({userInfo.email})
                </span>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">{log.action}</p>
          </div>
        </div>

        {/* Right Side: Badge + Time + Expand Button */}
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold tracking-wide transition-transform duration-300 group-hover:scale-105 ${tagInfo.tone}`}>
            {tagInfo.tag}
          </span>
          <span className="hidden text-xs text-muted-foreground md:inline-block">
            {dateDisplay}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse details" : "Expand details"}
          >
            <span>{expanded ? "Less" : "Details"}</span>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Expanded Details Drawer */}
      {expanded && (
        <div className="mt-3.5 rounded-lg border border-border/70 bg-card/60 p-4 text-xs" onClick={(e) => e.stopPropagation()}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* User Details */}
            <div className="flex items-start gap-2">
              <User className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">User / Actor</p>
                <p className="text-muted-foreground">{userInfo.name}</p>
                {userInfo.email && <p className="text-muted-foreground">{userInfo.email}</p>}
              </div>
            </div>

            {/* Action */}
            <div className="flex items-start gap-2">
              <IconComponent className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Action Summary</p>
                <p className="text-muted-foreground">{log.action}</p>
                <p className="text-muted-foreground capitalize">Category: {tagInfo.tag}</p>
              </div>
            </div>

            {/* IP / Network Info */}
            <div className="flex items-start gap-2">
              <Globe className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Network / IP</p>
                <p className="text-muted-foreground">
                  {(log.ip_address || log.ip || "N/A") as string}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-start gap-2">
              <Clock className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Timestamp</p>
                <p className="text-muted-foreground">{dateDisplay}</p>
                {(log.created || log.created_at || log.timestamp) && (
                  <p className="font-mono text-[10px] text-muted-foreground/80 mt-0.5">
                    {String(log.created || log.created_at || log.timestamp)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details / Payload Block */}
          {detailsText && (
            <div className="mt-3.5 border-t border-border/50 pt-3">
              <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
                <Info className="size-3.5 text-muted-foreground" />
                <span>Additional Details:</span>
              </div>
              <pre className="overflow-x-auto rounded bg-muted/50 p-2.5 font-mono text-[11px] text-foreground leading-relaxed whitespace-pre-wrap">
                {detailsText}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
