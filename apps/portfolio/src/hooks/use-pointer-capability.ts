"use client";

import { useEffect, useState } from "react";
import { getPointerCapability, type PointerCapability } from "@/lib/performance/device-capability";

export function usePointerCapability() {
  const [capability, setCapability] = useState<PointerCapability>("none");

  useEffect(() => {
    const queries = [
      window.matchMedia("(hover: hover) and (pointer: fine)"),
      window.matchMedia("(pointer: coarse)")
    ];

    const update = () => setCapability(getPointerCapability());
    update();
    queries.forEach((query) => query.addEventListener("change", update));

    return () => queries.forEach((query) => query.removeEventListener("change", update));
  }, []);

  return capability;
}
