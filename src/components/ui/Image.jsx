import { useEffect, useRef, useState } from 'react';
import { cn } from '@utils';

function Image({
  src,
  alt,
  placeholderSrc,
  className,
  wrapperClassName,
  rootMargin = '120px',
  threshold = 0.1,
  ...props
}) {
  const imageRef = useRef(null);
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!imageRef.current) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(imageRef.current);
    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={imageRef} className={cn('relative overflow-hidden', wrapperClassName)}>
      {placeholderSrc && !isLoaded ? (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          data-testid="image-blur-placeholder"
          className="absolute inset-0 h-full w-full object-cover blur-xl scale-110 opacity-70"
        />
      ) : null}
      <img
        src={isVisible ? src : undefined}
        data-loaded={isLoaded ? 'true' : 'false'}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-400',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
}

export { Image };
