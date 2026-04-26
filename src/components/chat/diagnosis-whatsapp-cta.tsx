'use client';

import { trackWhatsAppClick } from '@/lib/analytics';

const WHATSAPP_NUMBER = '5493515284074';

const WA_MESSAGE =
  'Hola DefensaYa, ya completé el análisis preliminar y quiero hablar con un especialista para presentar mi reclamo.';

type ChatWhatsAppCtaProps = {
  source: string;
  /** Texto predefinido del enlace */
  message?: string;
  label?: string;
};

/**
 * Botón de WhatsApp estilo hero (verde ancho completo) para colocar bajo el diagnóstico.
 */
export function DiagnosisWhatsAppCta({
  source,
  message = WA_MESSAGE,
  label = 'Hablar con un especialista',
}: ChatWhatsAppCtaProps) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 mt-4 w-full px-4 py-3 rounded-full text-base sm:text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.99]"
      style={{ background: '#25D366' }}
      onClick={() => trackWhatsAppClick(source)}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M11.894 0C5.354 0 0 5.353 0 11.893c0 2.098.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.913 11.913 0 005.533 1.375h.005C18.43 23.721 23.786 18.369 23.786 11.83 23.786 5.29 18.433-.001 11.894 0zm0 21.785h-.004a9.892 9.892 0 01-5.044-1.381l-.361-.214-3.742.981.998-3.648-.235-.374a9.842 9.842 0 01-1.51-5.27c0-5.445 4.432-9.876 9.882-9.876 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.89-9.865 9.89z" />
      </svg>
      {label}
    </a>
  );
}
