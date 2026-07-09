"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ListOptionItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  tone?: string;
}

export interface ListOptionChooserProps {
  value: string;
  onChange: (value: string) => void;
  options: (ListOptionItem | string)[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  searchable?: boolean;
}

export function ListOptionChooser({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
  triggerClassName,
  contentClassName,
  disabled = false,
  id,
  ariaLabel,
  searchable,
}: ListOptionChooserProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const normalizedOptions: ListOptionItem[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = React.useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  const shouldSearch = searchable ?? normalizedOptions.length > 7;

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const q = searchTerm.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchTerm]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearchTerm("");
  };

  const IconComp = selectedOption?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel || placeholder}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-input bg-card px-3.5 text-left font-normal shadow-xs transition-colors hover:bg-accent/40 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/30",
            !selectedOption && "text-muted-foreground",
            triggerClassName,
            className
          )}
        >
          <span className="flex items-center gap-2.5 truncate">
            {IconComp && <IconComp className="size-4 shrink-0 text-primary" />}
            <span className="truncate">{selectedOption?.label || placeholder}</span>
          </span>

          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open && "rotate-180 text-primary"
            )}
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-(--radix-popover-trigger-width) min-w-[200px] p-1.5 rounded-2xl border border-border shadow-xl bg-card",
          contentClassName
        )}
        align="start"
      >
        {shouldSearch && (
          <div className="relative mb-1.5 px-1 pt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search options..."
              className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-2.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div className="max-h-60 overflow-y-auto space-y-0.5 p-0.5">
          {filteredOptions.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No matching options found
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = opt.value === value;
              const OptIcon = opt.icon;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground hover:bg-accent/60"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {OptIcon && (
                      <OptIcon
                        className={cn(
                          "size-3.5 shrink-0",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    )}
                    <div className="truncate">
                      <p className="truncate leading-none">{opt.label}</p>
                      {opt.description && (
                        <p className="mt-1 text-[11px] font-normal text-muted-foreground truncate">
                          {opt.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
