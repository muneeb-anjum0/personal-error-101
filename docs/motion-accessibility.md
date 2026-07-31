# Motion Accessibility

Reduced motion is detected through CSS and `ReducedMotionProvider`. When active, Lenis, custom cursor, SVG pulses, pinned philosophy motion, contact convergence, parallax-like transforms, and magnetic behavior are disabled or rendered immediately.

Animated headings keep their accessible DOM text intact. Section reveals animate wrappers, opacity, clip-path, or transforms rather than replacing text with duplicate screen-reader strings.

The custom cursor is enabled only for large precise-pointer devices in full animation mode. Touch, coarse pointer, compact viewport, and reduced-motion users keep the native cursor.

Dialogs and mobile navigation still lock body scroll, close with Escape, restore focus, and remain usable immediately while their entrance animations run.
