"use client";

import { useState, useRef, useEffect } from "react";

export type SelectOption = {
  value: string;
  label: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  description?: string;
};

type LiquidSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  name?: string;
  placeholder?: string;
};

export function LiquidSelect({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  name,
  placeholder = "Seleccionar...",
}: LiquidSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Hidden input for standard form submission compatibility */}
      {name ? <input type="hidden" name={name} value={value} /> : null}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 select-none cursor-pointer border ${
          open
            ? "border-rose-500 bg-rose-500/15 text-white shadow-[0_0_18px_rgba(225,29,72,0.35)]"
            : "border-white/[0.09] bg-white/[0.035] text-slate-200 hover:border-white/[0.2] hover:bg-white/[0.06]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="truncate flex items-center gap-2">
          {selected ? (
            <>
              {selected.icon}
              <span>{selected.label}</span>
              {selected.badge}
            </>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </span>

        {/* Custom Chevron SVG */}
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180 text-rose-400" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Floating Liquid Glass Dropdown Bubble with Red Glow */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[180px] origin-top rounded-2xl border border-rose-500/30 bg-[#090d16]/95 p-1.5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.85),0_0_24px_-2px_rgba(225,29,72,0.3)] backdrop-blur-2xl transition-all animate-fadeIn overflow-hidden">
          <div className="space-y-0.5 max-h-60 overflow-y-auto pr-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 text-left select-none cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-md shadow-rose-950/60"
                      : "text-slate-300 hover:bg-rose-500/15 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {opt.badge}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
