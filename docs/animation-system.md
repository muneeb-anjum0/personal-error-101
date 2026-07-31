# Animation System

Phase 2 adds motion without changing the static-content architecture. Shared tokens live in `apps/portfolio/src/lib/animation` and client-only behavior lives in small components under `apps/portfolio/src/components/motion` and `apps/portfolio/src/components/cursor`.

Durations: instant 100ms, fast 180ms, normal 300ms, slow 500ms, section 700ms, hero 900ms.

Easings: standard `cubic-bezier(0.2, 0, 0, 1)`, entrance `cubic-bezier(0.16, 1, 0.3, 1)`, exit `cubic-bezier(0.7, 0, 0.84, 0)`, emphasis `cubic-bezier(0.19, 1, 0.22, 1)`, elastic-light `cubic-bezier(0.34, 1.35, 0.64, 1)`, mechanical `cubic-bezier(0.65, 0, 0.35, 1)`.

GSAP is used for scoped entrance, SVG, scroll progress, and philosophy timing. Components use `gsap.context()` and revert on unmount. ScrollTrigger is synchronized with Lenis through one ticker loop in `SmoothScrollProvider`.

Motion for React is used for project filtering and selected capability/experience panel transitions. Native CSS handles hover states, route-line drawing, dialog/menu entrance, and contact/footer view timelines.

React Bits: no external React Bits component was imported in Phase 2. The local reveal vocabulary covers the accepted lightweight text/line behavior without adding another visual dependency.

Phase 3 boundaries: future generator/CMS, GitHub sync, AI orchestration, and publishing automation should not consume these public motion modules directly.
