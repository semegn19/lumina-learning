import { BookOpen, Check, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";                     
import type { Course } from "@/lib/api-types";

interface CourseSelectorProps {
  courses: Course[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
}

export function CourseSelector({ courses, selectedIds, onChange }: CourseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredCourses = courses.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const selectedCourses = courses.filter((c) => selectedIds.includes(c.id));

  const toggleCourse = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeCourse = (id: number) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const selectAll = () => {
    onChange(courses.map((c) => c.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-foreground">
            Eligible Courses (Assign Discount)
          </label>
          <p className="text-xs text-muted-foreground">
            Search and select specific courses eligible for this promo code.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length < courses.length && (
            <button
              type="button"
              onClick={selectAll}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Select All
            </button>
          )}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-semibold text-muted-foreground hover:text-destructive"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Selected Chips / Badges Display */}
      {selectedCourses.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-primary/30 bg-primary-soft/30 p-3 max-h-36 overflow-y-auto">
          {selectedCourses.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-semibold shadow-xs"
            >
              <BookOpen className="size-3 text-primary shrink-0" aria-hidden />
              <span className="max-w-[200px] truncate">{c.title}</span>
              {c.price !== undefined && (
                <span className="text-muted-foreground font-normal">
                  (${Number(c.price).toFixed(2)})
                </span>
              )}
              <button
                type="button"
                onClick={() => removeCourse(c.id)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label={`Remove ${c.title}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {/* Search & Dropdown Combobox */}
      <div className="relative">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="text"
            value={searchTerm}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            placeholder={
              selectedIds.length === 0
                ? "Type to search courses e.g. Python, React (leave empty for All Courses)…"
                : "Search more courses to add…"
            }
            className="h-11 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30"
          />
        </div>

        {/* Floating Dropdown Results */}
        {isOpen && (
          <>
            {/* Backdrop to close dropdown on click outside */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-xl p-2 space-y-1">
              {filteredCourses.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">
                  No courses match "{searchTerm}".
                </p>
              ) : (
                filteredCourses.map((c) => {
                  const isSelected = selectedIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCourse(c.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                        isSelected
                          ? "bg-primary-soft text-primary font-bold"
                          : "hover:bg-accent text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="truncate">{c.title}</span>
                        {c.price !== undefined && (
                          <span className="text-muted-foreground font-normal shrink-0">
                            (${Number(c.price).toFixed(2)})
                          </span>
                        )}
                      </div>
                      {isSelected ? (
                        <Check className="size-4 shrink-0 text-primary" aria-hidden />
                      ) : null}
                    </button>
                  );
                })
              )}
              <div className="border-t border-border pt-1.5 px-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="w-full h-8 text-xs text-muted-foreground"
                >
                  Done Selecting
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Helper text */}
      <p className="text-[11px] text-muted-foreground">
        {selectedIds.length > 0 ? (
          <span className="font-semibold text-primary">
            ✓ Discount applies ONLY to the {selectedIds.length} selected {selectedIds.length === 1 ? "course" : "courses"}.
          </span>
        ) : (
          <span>
            ℹ️ No courses selected — discount code will apply to <strong>ALL courses</strong> on the platform.
          </span>
        )}
      </p>
    </div>
  );
}
