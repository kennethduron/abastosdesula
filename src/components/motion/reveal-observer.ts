type RevealCallback = () => void;

const callbacks = new Map<Element, RevealCallback>();
let observer: IntersectionObserver | null = null;

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          callbacks.get(entry.target)?.();
          callbacks.delete(entry.target);
          observer?.unobserve(entry.target);
        }

        if (callbacks.size === 0) {
          observer?.disconnect();
          observer = null;
        }
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 },
    );
  }

  return observer;
}

export function observeReveal(element: Element, callback: RevealCallback) {
  const revealObserver = getObserver();
  callbacks.set(element, callback);
  revealObserver.observe(element);

  return () => {
    callbacks.delete(element);
    revealObserver.unobserve(element);

    if (callbacks.size === 0) {
      revealObserver.disconnect();
      observer = null;
    }
  };
}
