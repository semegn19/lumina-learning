import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Eye, ListChecks, MoreVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { deleteCourse, getCourses } from "@/lib/courses-api";
import { getApiErrorMessage } from "@/lib/api-client";
import { formatPrice, getMediaUrl } from "@/lib/utils";
import type { Course } from "@/lib/api-types";

export const Route = createFileRoute("/manage/courses/")({
  head: () => ({
    meta: [
      { title: "Manage Courses | Lumina Learning" },
      {
        name: "description",
        content: "Review, edit and remove the courses and lessons you have published on Lumina Learning.",
      },
      { property: "og:title", content: "Manage Courses | Lumina Learning" },
      { property: "og:description", content: "Review, edit and remove your published courses and lessons." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/manage/courses" }],
  }),
  component: () => (
    <AdminGuard>
      <ManageCourses />
    </AdminGuard>
  ),
});

function ManageCourses() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["manage-courses", { search: query }],
    queryFn: async () => {
      const res = await getCourses({ search: query || undefined });
      return Array.isArray(res) ? res : res.results ?? [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (courseId: number) => deleteCourse(courseId),
    onSuccess: () => {
      toast.success(`Deleted “${pendingDelete?.title}”`);
      void queryClient.invalidateQueries({ queryKey: ["manage-courses"] });
      void queryClient.invalidateQueries({ queryKey: ["courses"] });
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error(`Delete failed: ${getApiErrorMessage(err)}`);
    },
  });

  const courses: Course[] = data ?? [];

  return (
    <div className="min-h-screen bg-canvas">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">My Courses</h1>
            <p className="mt-2 text-muted-foreground">Manage the courses and lessons you have created.</p>
          </div>
          <Button asChild className="gap-2 rounded-lg">
            <Link to="/courses/new">
              <Plus className="size-4" aria-hidden /> New Course
            </Link>
          </Button>
        </div>

        <div className="mt-8 relative max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses"
            aria-label="Search courses"
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : isError ? (
          <div className="mt-12 text-center text-destructive">
            Failed to load courses. Please check your connection and login status.
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-accent/60 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Course</th>
                  <th className="px-4 py-4 font-medium">Lessons</th>
                  <th className="px-4 py-4 font-medium">Students</th>
                  <th className="px-4 py-4 font-medium">Price</th>
                  <th className="px-4 py-4 font-medium">Level</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="bg-card">
                {courses.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to="/courses/$courseId"
                        params={{ courseId: String(c.id) }}
                        className="group flex items-center gap-3"
                      >
                        {c.thumbnail ? (
                          <img
                            src={getMediaUrl(c.thumbnail)}
                            alt={c.title}
                            className="size-10 shrink-0 rounded-xl object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition-transform">
                            <BookOpen className="size-4" aria-hidden />
                          </span>
                        )}
                        <div>
                          <p className="font-semibold group-hover:text-primary transition-colors">{c.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{c.lesson_count ?? 0}</td>
                    <td className="px-4 py-4 text-muted-foreground">{c.student_count ?? 0}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatPrice(c.price, c.currency)}</td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                        {c.level === "Beginner" || c.level === "B" ? "Beginner" : c.level === "Intermediate" || c.level === "I" ? "Intermediate" : "Advanced"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${c.title}`}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/courses/$courseId" params={{ courseId: String(c.id) }}>
                              <Eye className="size-4" aria-hidden /> View course
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/manage/courses/$courseId/edit" params={{ courseId: String(c.id) }}>
                              <Pencil className="size-4" aria-hidden /> Edit course
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/manage/courses/$courseId/lessons" params={{ courseId: String(c.id) }}>
                              <ListChecks className="size-4" aria-hidden /> Manage lessons
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setPendingDelete(c)}>
                            <Trash2 className="size-4" aria-hidden /> Delete course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                      {query ? `No courses match “${query}”.` : "No courses found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can't be undone. “{pendingDelete?.title}” and all of its lessons will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingDelete) return;
                deleteMutation.mutate(pendingDelete.id);
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
