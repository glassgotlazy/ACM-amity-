"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { ease } from "@/lib/motion";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  wide?: boolean;
};

export function Modal({ open, onClose, title, eyebrow, children, wide = false }: Props) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape, trap focus inside the panel, and stop the page behind
  // from scrolling while the dialog is open.
  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("input, button, textarea, a")?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      cancelAnimationFrame(raf);
      previous?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <motion.button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-scrim backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative max-h-[92vh] w-full overflow-y-auto border border-line-strong bg-surface ${
              wide ? "sm:max-w-3xl" : "sm:max-w-xl"
            }`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.99 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: reduce ? 0 : 0.32, ease }}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-line bg-surface/95 px-6 py-5 backdrop-blur sm:px-8">
              <div>
                {eyebrow ? <div className="meta-accent">{eyebrow}</div> : null}
                <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 -mt-1 h-9 w-9 shrink-0 text-ink-faint transition-colors hover:text-ink"
                aria-label="Close"
              >
                <span aria-hidden className="text-lg">
                  ✕
                </span>
              </button>
            </div>
            <div className="px-6 py-7 sm:px-8">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
