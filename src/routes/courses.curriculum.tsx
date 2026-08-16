import { createFileRoute } from "@tanstack/react-router";
import { CirclePlay, FileText, GripVertical, Lightbulb, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/courses/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum Builder | Lumina Learning" },
      {
        name: "description",
        content: "Structure your course modules, add lessons and upload video or PDF resources.",
      },
      { property: "og:title", content: "Curriculum Builder | Lumina Learning" },
      { property: "og:description", content: "Structure your course modules and upload resources." },
    ],
  }),
  component: CurriculumBuilder,
});

type Lesson = { id: number; title: string; description: string };

function CurriculumBuilder() {
  const [lessons, setLessons] = useState<Lesson[]>([
    { id: 1, title: "Introduction to Serene Design", description: "" },
  ]);

  const update = (id: number, patch: Partial<Lesson>) =>
    setLessons((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  return (
    <div className="min-h-screen bg-canvas-rose/40">

      <main className="mx-auto max-w-[1280px] px-6 py-8 md:px-8">
        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Curriculum Builder</h1>
            <p className="mt-2 text-muted-foreground">Structure your course modules and upload resources.</p>
          </div>
          <Button className="gap-2 rounded-lg" onClick={() => toast.success("Course published")}>
            Publish Course <Upload className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_330px]">
          <div className="space-y-6">
            {lessons.map((lesson, i) => (
              <article key={lesson.id} className="surface-card relative p-6 pl-10">
                <GripVertical
                  className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60"
                  aria-hidden
                />
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                    Lesson {i + 1}
                  </span>
                  <button
                    aria-label={`Delete lesson ${i + 1}`}
                    onClick={() => setLessons((ls) => ls.filter((l) => l.id !== lesson.id))}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>

                <Input
                  value={lesson.title}
                  onChange={(e) => update(lesson.id, { title: e.target.value })}
                  placeholder="Lesson title"
                  aria-label="Lesson title"
                  className="mt-4 h-12 rounded-lg text-lg font-semibold"
                />
                <Textarea
                  value={lesson.description}
                  onChange={(e) => update(lesson.id, { description: e.target.value })}
                  placeholder="Lesson description…"
                  aria-label="Lesson description"
                  className="mt-4 min-h-24 rounded-xl border-transparent bg-accent/50"
                />

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    { icon: FileText, title: "Upload Video", hint: "MP4, MOV up to 2GB" },
                    { icon: FileText, title: "Attach Resource", hint: "PDF, DOCX up to 50MB" },
                  ].map((u) => (
                    <button
                      key={u.title}
                      onClick={() => toast("File picker is not wired up in this prototype")}
                      className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-7 transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <u.icon className="size-5 text-muted-foreground" aria-hidden />
                      <span className="text-sm font-semibold">{u.title}</span>
                      <span className="text-xs text-muted-foreground">{u.hint}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}

            {lessons.length === 0 && (
              <p className="rounded-2xl border-2 border-dashed border-border p-10 text-center text-muted-foreground">
                No lessons yet — add your first one below.
              </p>
            )}

            <button
              onClick={() =>
                setLessons((ls) => [...ls, { id: Date.now(), title: "", description: "" }])
              }
              className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border py-12 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <Plus className="size-6 text-muted-foreground" aria-hidden />
              <span className="font-display text-2xl font-bold">Add New Lesson</span>
            </button>
          </div>

          <aside className="space-y-6">
            <div className="surface-card p-6">
              <h2 className="text-xl font-bold">Course Structure</h2>
              <ul className="mt-5 space-y-3">
                {lessons.map((l, i) => (
                  <li
                    key={l.id}
                    className="flex items-center gap-3 rounded-xl bg-accent/50 px-4 py-3 text-sm"
                  >
                    <CirclePlay
                      className={`size-4 ${l.title ? "text-primary" : "text-muted-foreground/50"}`}
                      aria-hidden
                    />
                    <span className={l.title ? "font-medium" : "text-muted-foreground"}>
                      {l.title ? `${i + 1}. ${l.title}` : "Empty Lesson"}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{l.title ? "5m" : "--"}</span>
                  </li>
                ))}
                {lessons.length === 0 && (
                  <li className="text-sm text-muted-foreground">Your lessons will appear here.</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl bg-accent p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Lightbulb className="size-4 text-primary" aria-hidden /> Curriculum Tips
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Keep lessons under 10 minutes to maximize student retention. Provide actionable PDF resources for
                complex concepts.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
