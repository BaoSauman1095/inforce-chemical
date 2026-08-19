"use client";

import { useEffect, useRef } from "react";

const DURATION_MS = 600;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Animates in-page `#anchor` navigation (nav links, hero/footer CTAs,
 * "back to top") via a self-driven requestAnimationFrame loop, instead of
 * `scrollIntoView({behavior:'smooth'})` or the CSS `scroll-behavior: smooth`
 * global switch.
 *
 * Both of those hand the animation off to the browser as a black box, and on
 * this page that black-box animation reproducibly gets stuck mid-scroll when
 * real wheel/trackpad input arrives while it's still running — the user ends
 * up stranded partway to the target, unable to scroll further in either
 * direction until something else nudges the scroll position. Driving the
 * animation ourselves means we can cancel it the instant any real input
 * arrives, handing control back to the user immediately instead of fighting
 * them.
 */
export default function SmoothScroll() {
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    function cancelAnimation() {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    }

    function animateScrollTo(targetY: number) {
      cancelAnimation();
      const startY = window.scrollY;
      const distance = targetY - startY;
      if (Math.abs(distance) < 1) return;

      const startTime = performance.now();

      function step(now: number) {
        const progress = Math.min((now - startTime) / DURATION_MS, 1);
        window.scrollTo(0, startY + distance * easeInOutQuad(progress));
        rafId.current = progress < 1 ? requestAnimationFrame(step) : null;
      }

      rafId.current = requestAnimationFrame(step);
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;

      const anchor = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.length < 2) return; // ignore bare "#"

      const target = document.querySelector(href);
      if (!(target instanceof HTMLElement)) return;

      e.preventDefault();

      const scrollMarginTop = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const targetY = target.getBoundingClientRect().top + window.scrollY - scrollMarginTop;
      animateScrollTo(Math.max(0, targetY));
      window.history.pushState(null, "", href);
    }

    // Any real scroll input cancels our animation immediately so it can
    // never end up fighting the user or leaving the page stuck mid-scroll.
    function onUserInput() {
      cancelAnimation();
    }

    document.addEventListener("click", onClick);
    window.addEventListener("wheel", onUserInput, { passive: true });
    window.addEventListener("touchstart", onUserInput, { passive: true });
    window.addEventListener("keydown", onUserInput);

    return () => {
      cancelAnimation();
      document.removeEventListener("click", onClick);
      window.removeEventListener("wheel", onUserInput);
      window.removeEventListener("touchstart", onUserInput);
      window.removeEventListener("keydown", onUserInput);
    };
  }, []);

  return null;
}
