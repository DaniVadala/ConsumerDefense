import type { NextConfig } from "next";
import path from "path";

// CSP kept in report-only mode while Radix UI / assistant-ui uses inline styles.
// Once confirmed clean in production logs, change key to 'Content-Security-Policy'.
const cspDirectives = [
  "default-src 'self'",
  // unsafe-inline required for Next.js inline scripts and assistant-ui/Radix styles
  "script-src 'self' 'unsafe-inline' https://app.cal.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.google-analytics.com",
  "font-src 'self'",
  "connect-src 'self' https://app.cal.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://api.openai.com",
  "frame-src https://app.cal.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy-Report-Only', value: cspDirectives },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
