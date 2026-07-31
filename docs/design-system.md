# Design System

Phase 1 uses a strict monochrome system: white background, black foreground, and greys created only from black opacity.

Typography uses `next/font` with Geist Sans for display/body and Geist Mono for technical labels. Sections use reusable labels, large editorial headings, and consistent spacing tokens from `globals.css`.

Buttons support primary, secondary, ghost, text, icon, and external variants. Every state keeps explicit black/white contrast.

Phase 2 animates existing wrappers such as the header, section shells, project panels, contact lines, and SVG engineering system. Motion stays monochrome: black lines, white surfaces, opacity changes, precise transforms, and no decorative color/glow system.

Motion tokens use 100ms, 180ms, 300ms, 500ms, 700ms, and 900ms durations with standard, entrance, exit, emphasis, elastic-light, and mechanical easing curves documented in `docs/animation-system.md`.
