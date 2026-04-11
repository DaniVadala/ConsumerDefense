'use client';

import { useCallback, useRef } from 'react';

const CAL_LINK = 'summaorigin/consulta';

/**
 * Loads the Cal.com embed script on demand (first click or after idle).
 * Avoids blocking the initial page load with a 3rd-party script.
 */
function loadCalScript(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  if (win._calLoaded) return Promise.resolve();
  win._calLoaded = true;

  return new Promise((resolve) => {
    (function (C: typeof win, A: string, L: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = function (a: any, ar: any) { a.q.push(ar); };
      const d = C.document;
      C.Cal = C.Cal || function () {
        const cal = C.Cal;
        // eslint-disable-next-line prefer-rest-params
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          const s = d.createElement('script');
          s.src = A;
          s.onload = () => resolve();
          d.head.appendChild(s);
          cal.loaded = true;
        }
        if (ar[0] === L) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const api = function (...args: any[]) { p(api, args); } as any;
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ['initNamespace', namespace]);
          } else {
            p(cal, ar);
          }
          return;
        }
        p(cal, ar);
      };
    })(win, 'https://app.cal.com/embed/embed.js', 'init');

    win.Cal('init', { origin: 'https://app.cal.com' });
    win.Cal('ui', {
      theme: 'light',
      styles: { branding: { brandColor: '#059669' } },
    });
  });
}

export function useCalModal() {
  const preloadedRef = useRef(false);

  // Preload on hover/focus so the script is ready by the time they click
  const preloadCal = useCallback(() => {
    if (preloadedRef.current) return;
    preloadedRef.current = true;
    loadCalScript();
  }, []);

  const openCalModal = useCallback(() => {
    loadCalScript().then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cal = (window as any).Cal;
      if (!cal) return;
      cal('modal', {
        calLink: CAL_LINK,
        config: { layout: 'month_view', theme: 'light' },
      });
    });
  }, []);

  return { openCalModal, preloadCal };
}
