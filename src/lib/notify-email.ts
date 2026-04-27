/** Inbox for lead form and lawyers waitlist emails. Override with LEAD_NOTIFY_EMAIL. */
const DEFAULT_LEAD_NOTIFY_EMAIL = 'angelyocca@hotmail.com';

export function getLeadNotifyEmail(): string {
  const fromEnv = process.env.LEAD_NOTIFY_EMAIL?.trim();
  return fromEnv || DEFAULT_LEAD_NOTIFY_EMAIL;
}
