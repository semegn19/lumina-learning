"use client";

import * as React from "react";
import { Clock, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string | undefined; // "HH:mm" (24h)
  onChange: (timeStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  clearable?: boolean;
}

const COMMON_PRESETS = [
  { label: "09:00 AM", value: "09:00" },
  { label: "10:00 AM", value: "10:00" },
  { label: "11:30 AM", value: "11:30" },
  { label: "01:00 PM", value: "13:00" },
  { label: "02:00 PM", value: "14:00" },
  { label: "03:30 PM", value: "15:30" },
  { label: "05:00 PM", value: "17:00" },
  { label: "06:00 PM", value: "18:00" },
  { label: "07:30 PM", value: "19:30" },
];

const HOURS_12 = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
const MINUTES = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

// Convert 24h string ("14:30") to 12h representation
function parse24HTime(timeStr?: string) {
  if (!timeStr) return { hour12: "09", minute: "00", period: "AM" as "AM" | "PM" };
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return { hour12: "09", minute: "00", period: "AM" as "AM" | "PM" };

  let h = parseInt(match[1]!, 10);
  const minute = match[2]!;
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;

  const hour12 = String(h).padStart(2, "0");
  return { hour12, minute, period };
}

// Convert 12h representation to 24h string ("HH:mm")
function to24HString(hour12: string, minute: string, period: "AM" | "PM"): string {
  let h = parseInt(hour12, 10);
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h < 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
  id,
  clearable = true,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const { hour12, minute, period } = React.useMemo(() => parse24HTime(value), [value]);

  const handleHourSelect = (h: string) => {
    onChange(to24HString(h, minute, period));
  };

  const handleMinuteSelect = (m: string) => {
    onChange(to24HString(hour12, m, period));
  };

  const handlePeriodToggle = (p: "AM" | "PM") => {
    onChange(to24HString(hour12, minute, p));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const formattedDisplay = React.useMemo(() => {
    if (!value) return null;
    const { hour12: h, minute: m, period: p } = parse24HTime(value);
    return `${h}:${m} ${p}`;
  }, [value]);

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
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2.5 truncate">
            <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="truncate">{formattedDisplay || placeholder}</span>
          </span>

          <span className="flex items-center gap-1">
            {clearable && value && !disabled && (
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
                title="Clear time"
              >
                <X className="size-3" />
              </span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 rounded-2xl border border-border shadow-xl bg-card"
        align="start"
      >
        <div className="space-y-4">
          {/* Header Preview & AM/PM Switcher */}
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Selected Time
              </p>
              <p className="text-xl font-bold text-foreground">
                {hour12}:{minute} {period}
              </p>
            </div>
            <div className="flex rounded-xl bg-muted/60 p-1 border border-border/50">
              <button
                type="button"
                onClick={() => handlePeriodToggle("AM")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-colors",
                  period === "AM"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handlePeriodToggle("PM")}
                className={cn(
                  "rounded-lg px-3 py-1 text-xs font-bold transition-colors",
                  period === "PM"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Popular Presets
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {COMMON_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    onChange(preset.value);
                  }}
                  className={cn(
                    "rounded-lg border px-2 py-1 text-xs font-medium transition-colors text-center",
                    value === preset.value
                      ? "border-primary bg-primary-soft text-primary font-bold shadow-xs"
                      : "border-border/60 bg-card hover:border-primary/40 hover:bg-accent/40 text-muted-foreground"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hour & Minute Columns */}
          <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
            {/* Hours */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Hour</p>
              <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto pr-1">
                {HOURS_12.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={cn(
                      "rounded-lg py-1.5 text-xs font-semibold transition-colors",
                      hour12 === h
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "hover:bg-accent/50 text-foreground"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Minute</p>
              <div className="grid grid-cols-3 gap-1 max-h-32 overflow-y-auto pr-1">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={cn(
                      "rounded-lg py-1.5 text-xs font-semibold transition-colors",
                      minute === m
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "hover:bg-accent/50 text-foreground"
                    )}
                  >
                    :{m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 rounded-lg px-4 text-xs font-semibold"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
