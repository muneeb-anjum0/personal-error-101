"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";
type RevealGeometry = Readonly<{
  x: number;
  y: number;
  radius: number;
}>;

const THEME_STORAGE_KEY = "muneeb-systems-theme";
const REVEAL_SAFETY_MARGIN = 20;

function isMobileViewport() {
  return window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

/**
 * Root View Transition snapshots use the layout viewport. Capture the button
 * center and those root bounds together immediately before the transition;
 * mobile browser chrome then cannot move an active reveal's origin or radius
 * halfway through its animation.
 */
function measureRevealGeometry(button: HTMLButtonElement): RevealGeometry {
  const rect = button.getBoundingClientRect();
  const root = document.documentElement;
  const width = root.clientWidth;
  const height = root.clientHeight;
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius =
    Math.max(
      Math.hypot(x, y),
      Math.hypot(width - x, y),
      Math.hypot(x, height - y),
      Math.hypot(width - x, height - y)
    ) + REVEAL_SAFETY_MARGIN;

  return Object.freeze({ x, y, radius });
}

function clearRevealState() {
  const root = document.documentElement;
  delete root.dataset.themeTransition;
  root.style.removeProperty("--theme-reveal-x");
  root.style.removeProperty("--theme-reveal-y");
  root.style.removeProperty("--theme-reveal-radius");
}

export function ThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transitioningRef = useRef(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function commitTheme(nextTheme: Theme) {
    applyTheme(nextTheme);
    flushSync(() => setTheme(nextTheme));
  }

  async function toggleTheme() {
    // A View Transition can only own one root snapshot sequence at a time.
    // The guard runs before any state or DOM mutation, so a spammed click is
    // a true no-op rather than an unanimated theme update.
    if (transitioningRef.current) {
      return;
    }

    const fromTheme: Theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const nextTheme: Theme = fromTheme === "light" ? "dark" : "light";
    const button = buttonRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Android's View Transition snapshots use browser-specific viewport
    // coordinates. On touch layouts, switch themes immediately instead of
    // showing a reveal from an unreliable point. Desktop keeps its circle.
    if (!button || reducedMotion || isMobileViewport() || !("startViewTransition" in document)) {
      commitTheme(nextTheme);
      return;
    }

    transitioningRef.current = true;
    setIsTransitioning(true);

    try {
      // This ref belongs to the actual interactive button, not its icon, the
      // navbar, or a responsive wrapper. Its geometry is frozen for the whole
      // desktop View Transition so layout changes cannot restart the circle.
      const geometry = measureRevealGeometry(button);
      const root = document.documentElement;
      root.style.setProperty("--theme-reveal-x", `${geometry.x}px`);
      root.style.setProperty("--theme-reveal-y", `${geometry.y}px`);
      root.style.setProperty("--theme-reveal-radius", `${geometry.radius}px`);
      root.dataset.themeTransition = `to-${nextTheme}`;
      const transition = document.startViewTransition(() => {
        // This is the only interactive mutation of the page theme. It happens
        // after the old snapshot is captured and before the new one is taken.
        commitTheme(nextTheme);
      });
      await transition.ready;
      // The CSS animation attached to the View Transition snapshot is the
      // sole owner of the reveal. Unlike WAAPI's pseudoElement option, this
      // is also honored by the Chromium build used on Android.
      await transition.finished;
    } catch {
      // A skipped transition still leaves the correct theme selected. Cleanup
      // below returns the control to its stable state without a stale mask.
      if (document.documentElement.dataset.theme !== nextTheme) {
        commitTheme(nextTheme);
      }
    } finally {
      clearRevealState();
      transitioningRef.current = false;
      setIsTransitioning(false);
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      ref={buttonRef}
      className={`theme-toggle${isDark ? " is-dark" : ""}`}
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      disabled={isTransitioning}
    >
      <span className="sr-only">{isDark ? "Light mode" : "Dark mode"}</span>
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4M18.7 18.7l-1.4-1.4M6.7 6.7 5.3 5.3" />
    </svg>
  );
}
