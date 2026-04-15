import { useEffect, useRef, useState } from 'react';

export function useReveal(options = {}) {
  const { threshold = 0.08, rootMargin = '0px 0px -40px 0px', triggerOnce = true } = options;
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isVisible];
}

export function useStaggeredReveal(itemCount, options = {}) {
  const { staggerDelay = 0.08, ...revealOptions } = options;
  const containerRef = useRef(null);
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = container.querySelectorAll('[data-reveal]');
            items.forEach((item, index) => {
              setTimeout(() => {
                setVisibleItems((prev) => [...prev, index]);
              }, index * staggerDelay * 1000);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: revealOptions.threshold || 0.08, rootMargin: revealOptions.rootMargin || '0px 0px -40px 0px' }
    );

    observer.observe(container);

    return () => observer.disconnect();
  }, [itemCount, staggerDelay, revealOptions.threshold, revealOptions.rootMargin]);

  return [containerRef, visibleItems];
}
