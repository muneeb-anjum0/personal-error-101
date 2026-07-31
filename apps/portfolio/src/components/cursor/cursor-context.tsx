"use client";

import { createContext, useContext } from "react";

export type CursorState = "DEFAULT" | "VIEW" | "OPEN" | "EMAIL" | "SOURCE";

export const cursorLabels: Record<CursorState, string> = {
  DEFAULT: "",
  VIEW: "VIEW",
  OPEN: "OPEN",
  EMAIL: "EMAIL",
  SOURCE: "SOURCE"
};

const CursorContext = createContext({
  state: "DEFAULT" as CursorState,
  setState: (() => {}) as (state: CursorState) => void
});

export const CursorProvider = CursorContext.Provider;

export function useCursor() {
  return useContext(CursorContext);
}
