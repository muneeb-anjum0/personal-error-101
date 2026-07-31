"use client";

import { cloneElement, isValidElement } from "react";
import { useMagneticMotion } from "@/hooks/use-magnetic-motion";

export function MagneticElement({
  children,
  strength = 8
}: {
  children: React.ReactElement<{ ref?: React.Ref<HTMLElement>; className?: string }>;
  strength?: number;
}) {
  const ref = useMagneticMotion<HTMLElement>(strength);

  if (!isValidElement(children)) {
    return children;
  }

  return cloneElement(children, {
    ref,
    className: [children.props.className, "magnetic-target"].filter(Boolean).join(" ")
  });
}
