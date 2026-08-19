"use client";

import { useEffect, useState } from "react";
import { useMotionSettings } from "@/components/motion/reduced-motion-provider";

interface HeroTypewriterProps {
  lines: string[];
}

export function HeroTypewriter({ lines }: HeroTypewriterProps) {
  const { reducedMotion } = useMotionSettings();
  const sequenceKey = lines.join("\u0000");
  const [renderedLines, setRenderedLines] = useState(() => lines.map(() => ""));
  const [terminalMark, setTerminalMark] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const wait = (duration: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, duration);
      });

    if (reducedMotion) {
      setRenderedLines(lines);
      setTerminalMark(true);
      return;
    }

    setRenderedLines(lines.map(() => ""));
    setTerminalMark(false);

    async function typeTitle() {
      await wait(440);

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        if (cancelled) return;
        const targetLine = lines[lineIndex] ?? "";

        for (let characterIndex = 1; characterIndex <= targetLine.length; characterIndex += 1) {
          if (cancelled) return;
          const text = targetLine.slice(0, characterIndex);
          setRenderedLines((current) => current.map((value, index) => (index === lineIndex ? text : value)));
          await wait(targetLine[characterIndex - 1] === " " ? 36 : 58);
        }

        await wait(120);
      }

      await wait(160);
      if (!cancelled) setTerminalMark(true);
    }

    void typeTitle();
    return () => {
      cancelled = true;
    };
  }, [lines, reducedMotion, sequenceKey]);

  return (
    <>
      {renderedLines.map((line, index) => (
        <span
          key={lines[index] ?? index}
          className="hero-type-line"
          aria-hidden="true"
        >
          {line}
          {index === lines.length - 1 && terminalMark ? <span className="hero-terminal-mark">.</span> : null}
        </span>
      ))}
      <span className="sr-only">{lines.join(" ")}.</span>
    </>
  );
}
