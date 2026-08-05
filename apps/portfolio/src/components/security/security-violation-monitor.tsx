"use client";

import { useEffect } from "react";

const storageKey = "muneeb.systems.security-violations";
const maximumStoredViolations = 20;

export function SecurityViolationMonitor() {
  useEffect(() => {
    function record(event: SecurityPolicyViolationEvent) {
      const violation = {
        blocked: event.blockedURI,
        directive: event.effectiveDirective,
        disposition: event.disposition,
        document: event.documentURI,
        source: event.sourceFile,
        timestamp: new Date().toISOString()
      };

      console.warn("Content Security Policy violation", violation);
      try {
        const previous = JSON.parse(sessionStorage.getItem(storageKey) ?? "[]") as unknown[];
        sessionStorage.setItem(
          storageKey,
          JSON.stringify([...previous.slice(-(maximumStoredViolations - 1)), violation])
        );
      } catch {
        // Security reporting must never interfere with the portfolio experience.
      }
    }

    window.addEventListener("securitypolicyviolation", record);
    return () => window.removeEventListener("securitypolicyviolation", record);
  }, []);

  return null;
}
