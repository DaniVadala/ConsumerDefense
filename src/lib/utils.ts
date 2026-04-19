import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Open email compose: mailto on mobile (handled by OS), Gmail web on desktop. */
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
