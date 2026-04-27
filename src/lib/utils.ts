import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Open email compose: mailto on mobile (handled by OS), Gmail web on desktop. */
/** Hero tiene id="chat"; hay dos widgets (móvil/desktop) con id duplicado "chat-widget" — no usar getElementById para scroll. */
export function scrollToChatAndFocus() {
  document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const focusVisibleTextarea = () => {
    const inputs = document.querySelectorAll<HTMLTextAreaElement>('[data-chat-input]');
    const textarea = Array.from(inputs).find((el) => el.offsetParent !== null);
    textarea?.focus({ preventScroll: true });
  };
  requestAnimationFrame(() => requestAnimationFrame(focusVisibleTextarea));
}

export function openMailCompose(to: string, subject: string, body: string) {
  const isMobile = window.matchMedia('(pointer: coarse)').matches;
  if (isMobile) {
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  } else {
    window.open(
      `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      '_blank',
      'noopener,noreferrer'
    );
  }
}
