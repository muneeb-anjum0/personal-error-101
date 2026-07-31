# Animation Performance

The animation budget is selected in `apps/portfolio/src/lib/performance/animation-budget.ts`: full for large precise-pointer screens, balanced for tablets/non-precise pointers, and minimal for mobile or reduced-motion users.

Performance safeguards:

- One Lenis/GSAP ticker loop
- Scoped GSAP contexts with cleanup
- Motion layout only for filtered project panels and selected detail panels
- Transforms and opacity preferred over layout-heavy animation
- No Three.js, WebGL, particle engines, video backgrounds, or expensive SVG filters
- Native scrolling on mobile
- No idle high-frequency React state updates

Lighthouse should be run against a production portfolio build after major animation edits. Phase 2 target scores are Accessibility 95+, Best Practices 95+, SEO 95+, with Performance kept as high as practical while preserving the intended interactions.

Phase 2 production audit, saved in `test-results/phase2-lighthouse.report.html` and `.json`: Performance 91, Accessibility 100, Best Practices 96, SEO 100. Lighthouse exited with a Windows temp cleanup warning after writing the reports.

Phase 2 production audit result: Performance 90, Accessibility 100, Best Practices 96, SEO 100. Reports were saved locally under `artifacts/phase2-lighthouse`.
