export const easings = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
  exit: "cubic-bezier(0.7, 0, 0.84, 0)",
  emphasis: "cubic-bezier(0.19, 1, 0.22, 1)",
  elasticLight: "cubic-bezier(0.34, 1.35, 0.64, 1)",
  mechanical: "cubic-bezier(0.65, 0, 0.35, 1)"
} as const;

export const gsapEasings = {
  standard: "power2.out",
  entrance: "power3.out",
  exit: "power2.in",
  emphasis: "expo.out",
  elasticLight: "back.out(1.15)",
  mechanical: "power1.inOut"
} as const;

export const motionEasings = {
  standard: [0.2, 0, 0, 1],
  entrance: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
  emphasis: [0.19, 1, 0.22, 1],
  elasticLight: [0.34, 1.35, 0.64, 1],
  mechanical: [0.65, 0, 0.35, 1]
} as const;
