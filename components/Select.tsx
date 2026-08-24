"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Custom-styled dropdown matching the brand/category filters in Catalog.tsx —
 * a native <select>'s option list can't be restyled consistently across
 * browsers, so this renders its own panel instead.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setOpen(false));

  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[11px] border bg-white px-4 py-3.5 text-left text-[15px] outline-none transition-colors",
          open ? "border-brand" : "border-[#dcd8d5]",
          selected ? "text-[#141414]" : "text-[#8a8582]"
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("flex-none text-[#8a8582] transition-transform", open && "rotate-180")}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[260px] overflow-y-auto rounded-[11px] bg-white p-1.5 shadow-panelLg"
          >
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "block w-full rounded-lg px-[10px] py-2.5 text-left text-[14px] font-medium transition-colors",
                !value ? "bg-brand text-white" : "text-[#8a8582] hover:bg-[#f3eff0]"
              )}
            >
              {placeholder}
            </button>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "block w-full rounded-lg px-[10px] py-2.5 text-left text-[14px] font-medium transition-colors",
                    active ? "bg-brand text-white" : "text-[#141414] hover:bg-[#f3eff0]"
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
