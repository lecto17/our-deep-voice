import { useCallback, useEffect, useRef } from 'react';

const useInfiniteScroll = (onIntersect: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  const callback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log('intersecting');
          onIntersect();
        }
      });
    },
    [onIntersect],
  );

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(callback, {
      rootMargin: '100px',
    });
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, callback, onIntersect]);

  return ref;
};

export default useInfiniteScroll;
