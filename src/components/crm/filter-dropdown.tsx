"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FilterDropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterDropdownProps {
  icon?: React.ReactNode;
  label: string;
  options: FilterDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  defaultLabel?: string;
  defaultValue?: string;
}

function useOutside(ref: React.RefObject<HTMLDivElement | null>, fn: () => void) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      fn();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, fn]);
}

export function FilterDropdown({
  icon,
  label,
  options,
  value,
  onChange,
  defaultLabel = "Todos",
  defaultValue = "all",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === value);
  const isDefault = value === defaultValue;
  const displayLabel = isDefault ? defaultLabel : selected?.label || value;
  const displayColor = isDefault ? "#94a3b8" : selected?.color;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition ${
          !isDefault
            ? "bg-card border-primary/40 text-foreground"
            : "bg-card border-border text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon || (displayColor && <span className="w-2 h-2 rounded-full" style={{ background: displayColor }} />)}
        <span className="text-xs text-muted-foreground">{label}:</span>
        <span>{displayLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[200px] py-1">
          <button
            onClick={() => { onChange(defaultValue); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition flex items-center gap-2 ${value === defaultValue ? "font-semibold" : ""}`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            {defaultLabel}
          </button>
          {options.length > 0 && <div className="border-t border-border my-1" />}
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition flex items-center gap-2 ${value === o.value ? "font-semibold" : ""}`}
            >
              {o.color && <span className="w-2 h-2 rounded-full" style={{ background: o.color }} />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
