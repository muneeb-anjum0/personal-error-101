import { ScrollTrigger } from "gsap/ScrollTrigger";

export function refreshScrollTriggers() {
  window.requestAnimationFrame(() => ScrollTrigger.refresh());
}

export function killScopedScrollTriggers(scope: Element) {
  ScrollTrigger.getAll().forEach((trigger) => {
    const triggerElement = trigger.trigger;
    if (triggerElement instanceof Element && scope.contains(triggerElement)) {
      trigger.kill();
    }
  });
}
