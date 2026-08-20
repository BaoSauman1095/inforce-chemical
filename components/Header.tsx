"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS, PHONE_DISPLAY, PHONE_TEL } from "@/lib/constants";

export default function Header() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/[.07] bg-ink/[.82] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] items-center gap-7 px-5 py-4 md:px-7">
        <a href="#top" className="flex flex-none items-center" onClick={closeMenu}>
          <span className="flex h-9 items-center rounded-lg bg-paper px-2.5 py-1.5">
            <Image
              src="/brand/logo-horizontal.jpg"
              alt="IN FORCE CHEMICAL"
              width={858}
              height={248}
              priority
              className="h-6 w-auto object-contain"
            />
          </span>
        </a>

        <nav className="ml-auto hidden gap-7 font-heading text-[13.5px] font-medium tracking-wide md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-paper/[.72] transition-colors hover:text-paper"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={`tel:${PHONE_TEL}`}
          className="ml-auto hidden flex-none items-center gap-2 rounded-[10px] bg-brand px-[18px] py-[10px] font-heading text-sm font-semibold tracking-wide text-white shadow-cta transition-colors hover:bg-brand-hover md:ml-0 md:flex"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className="flex-none">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4.5c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" />
          </svg>
          {PHONE_DISPLAY}
        </a>

        <button
          type="button"
          aria-label={open ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="ml-auto grid h-10 w-10 flex-none place-items-center rounded-lg border border-white/15 text-paper md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-white/[.07] md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-3 font-heading text-[15px] font-semibold text-paper/85 transition-colors hover:bg-white/5 hover:text-paper"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={`tel:${PHONE_TEL}`}
                onClick={closeMenu}
                className="mt-2 flex items-center justify-center gap-2 rounded-[10px] bg-brand px-4 py-3 font-heading text-sm font-bold tracking-wide text-white"
              >
                {PHONE_DISPLAY}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
