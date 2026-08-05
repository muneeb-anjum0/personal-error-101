"use client";

import { useEffect, useState } from "react";

export function useSectionVisibility(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id.replace(/^#/, "")))
      .filter((element): element is HTMLElement => Boolean(element));

    const firstElement = elements[0];
    if (!firstElement) {
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const configuredOffset = Number.parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingTop
      );
      const marker = Number.isFinite(configuredOffset) ? configuredOffset + 1 : 1;
      const reachedPageEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      const active = reachedPageEnd
        ? elements[elements.length - 1]
        : elements.reduce((current, element) => {
            return element.getBoundingClientRect().top <= marker ? element : current;
          }, firstElement);

      if (active) {
        setActiveId(`#${active.id}`);
      }
    };
    const scheduleUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.cancelAnimationFrame(frame);
    };
  }, [sectionIds]);

  return activeId;
}
