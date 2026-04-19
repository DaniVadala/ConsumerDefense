'use client';

import { useEffect } from 'react';
import { initScrollTracking, trackSectionView } from '@/lib/analytics';

const OBSERVED_SECTIONS = ['chat', 'como-funciona', 'qualifai'];

/**
 * Client component that initialises scroll-depth tracking and
 * fires `section_view` events when key page sections enter the viewport.
 */
export function AnalyticsProvider() {
  useEffect(() => {
    const cleanupScroll = initScrollTracking();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            trackSectionView(entry.target.id);
            observer.unobserve(entry.target); // fire once per section
          }
        }
      },
      { threshold: 0.3 },
    );

    for (const id of OBSERVED_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      cleanupScroll?.();
      observer.disconnect();
    };
  }, []);

  return null; // render nothing
}
