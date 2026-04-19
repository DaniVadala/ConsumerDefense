'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLocale } from '@/lib/i18n/context';
import { trackWhatsAppClick, trackFabTooltipShown, trackFabTooltipDismissed } from '@/lib/analytics';

const WHATSAPP_NUMBER = '5493515284074';

export function WhatsAppFab() {
  const { t } = useLocale();
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(t.info.waMessage)}`;
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show tooltip after 6s if user hasn't scrolled to InfoSection
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) {
        setShowTooltip(true);
        trackFabTooltipShown();
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  // Auto-hide tooltip after 8s
  useEffect(() => {
    if (!showTooltip) return;
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, [showTooltip]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Tooltip bubble */}
        {showTooltip && !dismissed && (
          <div
            className="relative bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 max-w-[220px] text-sm"
          >
            <button
              onClick={() => { setDismissed(true); setShowTooltip(false); trackFabTooltipDismissed(); }}
              className="absolute -top-2 -right-2 bg-gray-100 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
            <p className="text-gray-700 font-medium">{t.info.fabTooltipTitle}</p>
            <p className="text-gray-400 text-xs mt-0.5">{t.info.fabTooltipDesc}</p>
            {/* Caret */}
            <div className="absolute -bottom-[6px] right-6 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45" />
          </div>
        )}

      {/* FAB */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        onClick={() => { setDismissed(true); trackWhatsAppClick('fab'); }}
        className="group flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] shadow-[0_4px_20px_-2px_rgba(37,211,102,0.5)] hover:shadow-[0_6px_28px_-2px_rgba(37,211,102,0.6)] transition-all hover:scale-105 active:scale-95"
      >
        {/* WhatsApp SVG icon */}
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 fill-white"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
