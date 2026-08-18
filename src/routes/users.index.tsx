import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ChevronRight, Eye, MoreVertical, Pencil, Search, ShieldCheck, SlidersHorizontal, Trash2 } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteUser, getUsers, updateUser } from "@/lib/users-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { getMediaUrl } from "@/lib/utils";
import type { AuthUser, PaginatedResponse } from "@/lib/api-types";

export const Route = createFileRoute("/users/")({
  head: () => ({
    meta: [
      { title: "User Management | Lumina Learning" },
      {
        name: "description",
        content: "Manage team members, roles and account permissions for your academy.",
      },
      { property: "og:title", content: "User Management | Lumina Learning" },
      { property: "og:description", content: "Manage your team members and their account permissions." },
    ],
  }),
  component: () => (
    <AdminGuard>
      <UserManagement />
    </AdminGuard>
  ),
});

export function formatRole(role?: string, is_superuser?: boolean, is_staff?: boolean): string {
  if (!role) {
    if (is_superuser) return "Master Admin";
    if (is_staff) return "Secondary Admin";
    return "Student";
  }
  const normalized = role.trim().toUpperCase();
  if (normalized === "MA" || normalized === "MASTER ADMIN" || normalized === "MASTER_ADMIN") {
    return "Master Admin";
  }
  if (normalized === "SA" || normalized === "SECONDARY ADMIN" || normalized === "SECONDARY_ADMIN") {
    return "Secondary Admin";
  }
  if (normalized === "ST" || normalized === "STUDENT") {
    return "Student";
  }
  if (normalized === "INSTRUCTOR") {
    return "Instructor";
  }
  if (normalized === "ADMIN") {
    return "Master Admin";
  }
  return role;
}

function getDisplayName(u: Partial<AuthUser>): string {
  if (u.first_name || u.last_name) {
    return `${u.first_name || ""} ${u.last_name || ""}`.trim();
  }
  return u.username || u.email || "User";
}

const roleTone: Record<string, string> = {
  "Master Admin": "bg-success-soft text-success font-semibold",
  "Secondary Admin": "bg-success-soft text-success font-semibold",
  "Admin": "bg-success-soft text-success font-semibold",
  "Instructor": "bg-primary-soft text-primary font-semibold",
  "Student": "bg-info-soft text-info font-semibold",
};

function UserManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<{ id: string | number; name: string; email: string } | null>(null);
  const [pendingRoleUser, setPendingRoleUser] = useState<{ id: string | number; name: string; email: string; currentRole: string } | null>(null);
  const [selectedRoleCode, setSelectedRoleCode] = useState<"MA" | "SA" | "ST">("ST");

  const { data, isLoading } = useQuery({
    queryKey: ["users", query, page, roleFilter],
    queryFn: async () => {
      try {
        return await getUsers({
          search: query || undefined,
          role: roleFilter === "all" ? undefined : roleFilter,
          page,
        });
      } catch (err) {
        console.warn("Failed to fetch users from API:", err);
        return [];
      }
    },
  });

  const apiUsers: AuthUser[] = Array.isArray(data)
    ? data
    : (data as PaginatedResponse<AuthUser> | null)?.results || [];

  const totalCount = typeof data === "object" && data !== null && "count" in data && typeof (data as any).count === "number"
    ? (data as any).count
    : apiUsers.length;

  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  const filtered = apiUsers.filter((u: AuthUser) => {
    const name = getDisplayName(u).toLowerCase();
    const email = (u.email || "").toLowerCase();
    const q = query.toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q);

    if (!matchesSearch) return false;
    if (roleFilter === "all") return true;

    const roleStr = formatRole(u.role, u.is_superuser, u.is_staff);
    if (roleFilter === "MA") return roleStr === "Master Admin" || u.role === "MA";
    if (roleFilter === "SA") return roleStr === "Secondary Admin" || u.role === "SA";
    if (roleFilter === "ST") return roleStr === "Student" || u.role === "ST";
    return true;
  });

  const deleteMut = useMutation({
    mutationFn: (id: string | number) => deleteUser(id),
    onSuccess: () => {
      toast.success(`Successfully deleted user ${pendingDelete?.name}`);
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(`Failed to delete user: ${getApiErrorMessage(err)}`);
    },
  });

  const roleMut = useMutation({
    mutationFn: async () => {
      if (!pendingRoleUser) return;
      return await updateUser(pendingRoleUser.id, {
        role: selectedRoleCode,
        is_staff: selectedRoleCode === "SA" || selectedRoleCode === "MA",
        is_superuser: selectedRoleCode === "MA",
      });
    },
    onSuccess: () => {
      const roleLabel = selectedRoleCode === "MA" ? "Master Admin" : selectedRoleCode === "SA" ? "Secondary Admin" : "Student";
      toast.success(`Updated role for ${pendingRoleUser?.name} to ${roleLabel}`);
      setPendingRoleUser(null);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      toast.error(`Failed to change role: ${getApiErrorMessage(err)}`);
    },
  });

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((n) => n !== id) : [...s, id]));

  const isUserAdmin = isAdmin(currentUser?.role as any);

  return (
    <div className="min-h-screen bg-background">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">User management</h1>
        <p className="mt-1.5 text-base text-muted-foreground">Manage your team members and their account permissions here.</p>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">
            All users <span className="text-lg font-medium text-muted-foreground">{filtered.length}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search users"
                className="h-10 w-56 rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 gap-2 rounded-lg">
                  <SlidersHorizontal className="size-4" aria-hidden />
                  {roleFilter === "all"
                    ? "Filters"
                    : roleFilter === "MA"
                    ? "Role: Master Admin"
                    : roleFilter === "SA"
                    ? "Role: Secondary Admin"
                    : "Role: Student"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onSelect={() => setRoleFilter("all")}>
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRoleFilter("MA")}>
                  Master Admin (MA)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRoleFilter("SA")}>
                  Secondary Admin (SA)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setRoleFilter("ST")}>
                  Student (ST)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">
              <div className="mx-auto size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-3 text-sm">Loading users…</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="w-12 px-6 py-4">
                    <Checkbox
                      aria-label="Select all users"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onCheckedChange={(v) => setSelected(v ? filtered.map((u) => String(u.id)) : [])}
                    />
                  </th>
                  <th className="py-4 font-medium">User name</th>
                  <th className="py-4 font-medium">Role</th>
                  <th className="py-4 font-medium">
                    <span className="inline-flex items-center gap-1">
                      Status <ArrowDown className="size-3.5" aria-hidden />
                    </span>
                  </th>
                  <th className="py-4 font-medium">Date added</th>
                  <th className="py-4" />
                </tr>
              </thead>
              <tbody className="bg-card">
                {filtered.map((u: AuthUser) => {
                  const uid = String(u.id);
                  const name = getDisplayName(u);
                  const roleStr = formatRole(u.role, u.is_superuser, u.is_staff);
                  const avatarSrc = getMediaUrl(u.profile_picture || u.avatar) || undefined;
                  const dateStr = u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "Jan 1, 2024";
                  const statusStr = u.is_active !== undefined ? (u.is_active ? "Active" : "Inactive") : "Active";

                  return (
                    <tr
                      key={uid}
                      onClick={() => void navigate({ to: "/users/$userId", params: { userId: uid } })}
                      className="group border-t border-border hover:bg-accent/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Select ${name}`}
                          checked={selected.includes(uid)}
                          onCheckedChange={() => toggle(uid)}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 transition-transform duration-300 group-hover:scale-105">
                            <AvatarImage src={avatarSrc || undefined} alt="" className="object-cover" />
                            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{name}</p>
                            <p className="text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleTone[roleStr] || "bg-accent text-foreground"}`}>
                          {roleStr}
                        </span>
                      </td>
                      <td className="py-4 text-muted-foreground">{statusStr}</td>
                      <td className="py-4 text-muted-foreground">{dateStr}</td>
                      <td className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            aria-label={`Actions for ${name}`}
                            className="text-muted-foreground transition-colors hover:text-foreground p-1 rounded-md hover:bg-accent"
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={() => void navigate({ to: "/users/$userId", params: { userId: uid } })}
                            >
                              <Eye className="size-4" aria-hidden /> View profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => void navigate({ to: "/users/$userId/edit", params: { userId: uid } })}
                            >
                              <Pencil className="size-4" aria-hidden /> Edit user
                            </DropdownMenuItem>
                            {isUserAdmin && (
                              <DropdownMenuItem
                                onSelect={() => {
                                  const currentCode = u.role === "MA" || roleStr === "Master Admin" ? "MA" : u.role === "SA" || roleStr === "Secondary Admin" ? "SA" : "ST";
                                  setSelectedRoleCode(currentCode);
                                  setPendingRoleUser({ id: u.id, name, email: u.email, currentRole: roleStr });
                                }}
                              >
                                <ShieldCheck className="size-4 text-primary" aria-hidden /> Change role
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onSelect={() => setPendingDelete({ id: u.id, name, email: u.email })}
                            >
                              <Trash2 className="size-4" aria-hidden /> Delete user
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      No users match “{query}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-border bg-card py-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex size-8 items-center justify-center rounded-lg text-sm ${
                    p === page ? "bg-accent font-semibold text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Change Role Modal */}
      <Dialog open={pendingRoleUser !== null} onOpenChange={(o) => !o && setPendingRoleUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="size-5 text-primary" /> Change User Role
            </DialogTitle>
            <DialogDescription>
              Select a new platform role for {pendingRoleUser?.name} ({pendingRoleUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="field-label">Select Role</Label>
              <Select value={selectedRoleCode} onValueChange={(v) => setSelectedRoleCode(v as "MA" | "SA" | "ST")}>
                <SelectTrigger className="h-12 w-full rounded-lg">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MA">Master Admin (MA)</SelectItem>
                  <SelectItem value="SA">Secondary Admin (SA)</SelectItem>
                  <SelectItem value="ST">Student (ST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRoleUser(null)} className="rounded-lg">
              Cancel
            </Button>
            <Button
              disabled={roleMut.isPending}
              onClick={() => roleMut.mutate()}
              className="rounded-lg px-6"
            >
              {roleMut.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure? This action can't be undone.</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `${pendingDelete.name} (${pendingDelete.email}) will be permanently removed from the academy.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && deleteMut.mutate(pendingDelete.id)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
