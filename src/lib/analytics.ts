/**
 * Centralized analytics module for DefensaYa conversion tracking.
 *
 * Uses Google Analytics 4 (gtag.js). The measurement ID is read from
 * NEXT_PUBLIC_GA_MEASUREMENT_ID — works on any domain (Vercel, custom, etc.).
 *
 * All event helpers are no-ops when gtag isn't loaded (dev, missing env var).
 */

/* ── Core gtag wrapper ── */

type GtagParams = Record<string, string | number | boolean | undefined>;

function gtag(command: 'event', action: string, params?: GtagParams): void {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (typeof w.gtag === 'function') {
    w.gtag(command, action, params);
  }
}

/* ── Navigation & Engagement ── */

export function trackNavClick(target: string, source: 'header' | 'mobile_menu') {
  gtag('event', 'nav_click', { target, source });
}

export function trackLanguageChange(language: 'es' | 'en') {
  gtag('event', 'language_change', { language });
}

export function trackSectionView(sectionId: string) {
  gtag('event', 'section_view', { section_id: sectionId });
}

/* ── Chat Funnel ── */

export function trackChatFocus() {
  gtag('event', 'chat_focus');
}

export function trackChatSuggestionClick(suggestion: string) {
  gtag('event', 'chat_suggestion_click', { suggestion });
}

export function trackChatMessageSent(messageNumber: number) {
  gtag('event', 'chat_message_sent', { message_number: messageNumber });
}

export function trackChatAreaSelected(area: string) {
  gtag('event', 'chat_area_selected', { area });
}

export function trackChatIntakeAnswer(step: number, totalSteps: number) {
  gtag('event', 'chat_intake_answer', { step, total_steps: totalSteps });
}

/** Funnel por paso del intake (metadato currentStep). */
export function trackChatIntakeStep(stepName: string) {
  gtag('event', 'chat_intake_step', { step_name: stepName });
}

export function trackChatDiagnosticGenerated(casoId: string, area: string) {
  gtag('event', 'chat_diagnostic_generated', { caso_id: casoId, area });
}

/* ── Calendar Funnel ── */

const calPreloadTracked = new Set<string>();

export function trackCalPreload(source: string) {
  if (calPreloadTracked.has(source)) return;
  calPreloadTracked.add(source);
  gtag('event', 'cal_preload', { source });
}

export function trackCalModalOpen(source: string) {
  gtag('event', 'cal_modal_open', { source });
}

export function trackCalBookingConfirmed() {
  gtag('event', 'cal_booking_confirmed');
}

/* ── WhatsApp Funnel ── */

export function trackWhatsAppClick(source: string, casoId?: string) {
  gtag('event', 'whatsapp_click', { source, caso_id: casoId });
}

/* ── Lead Form Funnel ── */

export function trackLeadFormOpen(source: string) {
  gtag('event', 'lead_form_open', { source });
}

export function trackLeadFormSubmit() {
  gtag('event', 'lead_form_submit');
}

export function trackLeadFormError() {
  gtag('event', 'lead_form_error');
}

/* ── Email ── */

export function trackEmailClick(source: string) {
  gtag('event', 'email_click', { source });
}

/* ── External Links ── */

export function trackExternalLinkClick(url: string, label: string) {
  gtag('event', 'external_link_click', { url, label });
}

/* ── FAB ── */

export function trackFabTooltipShown() {
  gtag('event', 'fab_tooltip_shown');
}

export function trackFabTooltipDismissed() {
  gtag('event', 'fab_tooltip_dismissed');
}

/* ── Scroll Depth ── */

let scrollThresholds = new Set<number>();

export function initScrollTracking() {
  if (typeof window === 'undefined') return;
  scrollThresholds = new Set<number>();

  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const percent = Math.round((scrollTop / docHeight) * 100);

    for (const threshold of [25, 50, 75, 100]) {
      if (percent >= threshold && !scrollThresholds.has(threshold)) {
        scrollThresholds.add(threshold);
        gtag('event', 'scroll_depth', { percent: threshold });
      }
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}
