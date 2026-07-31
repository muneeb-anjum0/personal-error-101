import { durations } from "./durations";
import { motionEasings } from "./easings";

export const revealVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.section, ease: motionEasings.entrance }
  }
} as const;

export const panelVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.slow, ease: motionEasings.entrance }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: durations.fast, ease: motionEasings.exit }
  }
} as const;
