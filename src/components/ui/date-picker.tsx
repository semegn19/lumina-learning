"use client";

import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: string | Date | undefined;
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  minDate?: Date;
  maxDate?: Date;
  clearable?: boolean;
}

// Safely convert date string "YYYY-MM-DD" to a local Date object without timezone shift
function parseDateStringToLocalDate(val?: string | Date): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  const str = String(val).trim();
  if (!str) return undefined;

  const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const year = parseInt(match[1]!, 10);
    const month = parseInt(match[2]!, 10) - 1;
    const day = parseInt(match[3]!, 10);
    return new Date(year, month, day);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

// Convert local Date object to "YYYY-MM-DD" format
function formatDateToISOString(date?: Date): string {
  if (!date || isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
  id,
  minDate,
  maxDate,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = React.useMemo(() => parseDateStringToLocalDate(value), [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(formatDateToISOString(date));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const formattedDisplay = React.useMemo(() => {
    if (!selectedDate) return null;
    return selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-input bg-card px-3.5 text-left font-normal shadow-xs transition-colors hover:bg-accent/40 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2.5 truncate">
            <CalendarIcon className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{formattedDisplay || placeholder}</span>
          </span>

          <span className="flex items-center gap-1">
            {clearable && selectedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClear(e as unknown as React.MouseEvent);
                  }
                }}
                className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Clear date"
              >
                <X className="size-3" />
              </span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl border border-border shadow-xl bg-card"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (minDate && date < minDate) return true;
            if (maxDate && date > maxDate) return true;
            return false;
          }}
          initialFocus
          className="rounded-2xl p-3"
        />
        {selectedDate && (
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 text-xs text-muted-foreground bg-muted/20 rounded-b-2xl">
            <span>Selected: <strong className="text-foreground">{formattedDisplay}</strong></span>
            <button
              type="button"
              onClick={() => {
                onChange(formatDateToISOString(new Date()));
                setOpen(false);
              }}
              className="font-semibold text-primary hover:underline"
            >
              Today
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
