import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}

/**
 * Zero-rerender GPU scroll progress hairline bar pinned at the top of the viewport.
 */
export function ScrollProgressBar() {
  const barRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const bar = barRef.current;
      if (!bar) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 20 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      bar.style.opacity = ratio > 0.008 ? '1' : '0';
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className="scroll-progress-shell" aria-hidden="true">
      <div ref={barRef} className="scroll-progress-bar" />
    </div>
  );
}

/**
 * Lightweight scrolled-state hook that only triggers state updates when crossing threshold.
 */
export function useScrolledHeader(threshold = 28) {
  const [scrolled, setScrolled] = useState(() => (typeof window !== 'undefined' ? window.scrollY > threshold : false));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let rafId = 0;
    const check = () => {
      rafId = 0;
      const next = window.scrollY > threshold;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [threshold]);

  return scrolled;
}

/**
 * Scroll-reveal editorial wrapper with progressive enhancement.
 * Never leaves content hidden if IntersectionObserver or motion is unavailable.
 */
export function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  delay = 0,
  variant = 'up',
  style,
  ...rest
}) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const [state, setState] = useState('visible'); // 'armed' | 'visible'

  useEffect(() => {
    if (reduced || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setState('visible');
      return undefined;
    }

    const node = ref.current;
    if (!node) return undefined;

    const rect = node.getBoundingClientRect();
    // If already within or above the visible viewport on mount, reveal immediately without flash
    if (rect.top < window.innerHeight * 0.94) {
      setState('visible');
      return undefined;
    }

    setState('armed');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setState('visible');
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  const mergedStyle = delay > 0 ? { ...style, '--reveal-delay': `${delay}ms` } : style;
  const classes = `reveal-block reveal-${variant} is-${state}${className ? ` ${className}` : ''}`;

  return (
    <Tag ref={ref} className={classes} style={mergedStyle} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Smooth easeOutQuart counter triggered once when scrolled into view.
 */
export function AnimatedCount({ value, suffix = '' }) {
  const target = Number(value) || 0;
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(target);
  const ref = useRef(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (reduced || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setDisplay(target);
      return undefined;
    }
    const node = ref.current;
    if (!node) return undefined;

    let rafId = 0;
    const runAnimation = () => {
      if (hasAnimatedRef.current) {
        setDisplay(target);
        return;
      }
      hasAnimatedRef.current = true;
      const duration = 760;
      const start = performance.now();
      const step = (now) => {
        const elapsed = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - elapsed, 4);
        setDisplay(Math.round(eased * target));
        if (elapsed < 1) {
          rafId = window.requestAnimationFrame(step);
        } else {
          setDisplay(target);
        }
      };
      rafId = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [target, reduced]);

  return (
    <span ref={ref} className="animated-count">
      {display}
      {suffix}
    </span>
  );
}

/**
 * Pointer-tracked radial spotlight helper (zero React state re-renders).
 */
export function handleSpotlightMove(event) {
  if (event.pointerType && event.pointerType !== 'mouse') return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  el.style.setProperty('--spot-x', `${x.toFixed(1)}px`);
  el.style.setProperty('--spot-y', `${y.toFixed(1)}px`);
}

/**
 * Kinetic infinite streetwear brand ticker tape.
 */
export function BrandTicker({ brands = [] }) {
  const curated = brands.slice(0, 14);
  if (!curated.length) return null;

  return (
    <section className="kinetic-brand-ticker" aria-label="Featured streetwear labels">
      <div className="kinetic-ticker-track">
        {[0, 1].map((copyIdx) => (
          <div
            className="kinetic-ticker-group"
            key={copyIdx}
            aria-hidden={copyIdx === 1 ? 'true' : undefined}
          >
            {curated.map((b) => (
              <Link
                key={`${copyIdx}-${b.name}`}
                to={`/shop?brand=${encodeURIComponent(b.name)}`}
                className="kinetic-brand-item"
                tabIndex={copyIdx === 1 ? -1 : undefined}
              >
                <span className="kinetic-brand-name">{b.name}</span>
                <sup className="kinetic-brand-count">{String(b.count).padStart(2, '0')}</sup>
                <span className="kinetic-brand-sep" aria-hidden="true">✦</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
