"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GitHubStarLink } from "./GitHubStarLink";
import { FormatToggle } from "./FormatToggle";
import { LocaleSwitcher } from "./LocaleSwitcher";

/**
 * Mobile-only hamburger that slides a drawer in from the left. Holds:
 *   - The section nav links
 *   - GitHub star CTA
 *   - Format toggle (singles / doubles)
 *   - Locale switcher
 *
 * Server-side Nav passes `sectionLinks` so the drawer can construct
 * locale-aware Link components without duplicating the link table.
 */
export function MobileMenu({
  sectionLinks,
}: {
  sectionLinks: { href: string; label: string }[];
}) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Portal target only exists after hydration; gate the portal on `mounted`.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close on route change so tapping a link dismisses the drawer.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Esc to close + lock body scroll while the drawer is open. Also set a body
  // data-attribute so unrelated fixed UI (the My-Pokémon FAB) can hide itself
  // without each component knowing about the drawer's state.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.menuOpen = "1";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      delete document.body.dataset.menuOpen;
    };
  }, [open]);

  // The drawer must escape the Nav <header>'s containing block (the header has
  // `backdrop-blur`, which makes `position: fixed` resolve against the header
  // instead of the viewport — clipping everything past the header's height).
  // Render it via portal to `document.body` so `fixed inset-0` covers the
  // whole viewport.
  const drawer = (
    <>
      {/* Backdrop — above the My-Pokémon FAB (z-50) so the drawer can cover it. */}
      <div
        onClick={() => setOpen(false)}
        className={
          "fixed inset-0 z-[9998] bg-black/40 transition-opacity duration-200 md:hidden " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        aria-hidden="true"
      />

      {/* Drawer — slides in from the left, anchored top/bottom to the viewport */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        className={
          "fixed inset-y-0 left-0 z-[9999] flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-200 dark:bg-zinc-900 md:hidden " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <span className="text-sm font-bold uppercase tracking-wider text-zinc-500">
            {t("menu")}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("closeMenu")}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {sectionLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <FormatToggle className="w-full justify-center" />
          <div className="flex items-center justify-between gap-2">
            <GitHubStarLink />
            <LocaleSwitcher />
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
      >
        {/* Hamburger icon — three bars */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {mounted ? createPortal(drawer, document.body) : null}
    </>
  );
}
