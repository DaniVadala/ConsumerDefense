'use client';

import { useEffect, useCallback, useRef } from 'react';

const CAL_LINK = 'summaorigin/consulta';

/**
 * Lazily loads the Cal.com embed script using the official snippet pattern
 * and exposes a function to open the scheduling modal.
 */
export function useCalModal() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Official Cal.com embed snippet (adapted)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
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
          d.head.appendChild(d.createElement('script')).src = A;
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
  }, []);

  const openCalModal = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cal = (window as any).Cal;
    if (!cal) return;

    cal('modal', {
      calLink: CAL_LINK,
      config: {
        layout: 'month_view',
        theme: 'light',
      },
    });
  }, []);

  return { openCalModal };
}
