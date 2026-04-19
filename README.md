# DefensaYa — AI Consumer Rights Advisor 🛡️

**DefensaYa** is an AI-powered platform that helps Argentine consumers understand their legal rights. Users describe their problem in natural language and receive an instant preliminary assessment citing applicable consumer protection laws, along with concrete next steps.

> **Live demo →** [defensaya.com](https://defensaya.com)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-6-000?logo=vercel)

---

## Features

| Feature | Description |
|---|---|
| **AI Chat** | Real-time streaming conversation powered by Groq (Llama 3.3 70B) via the Vercel AI SDK |
| **Diagnostic Card** | Structured JSON output with applicable laws, legal context, and actionable next steps |
| **Lead Capture** | Form with Zod validation, submitted via Resend email API |
| **Cal.com Integration** | Lazy-loaded scheduling modal for free lawyer consultations |
| **i18n** | Full Spanish / English support via React Context |
| **Security** | CSP headers, rate limiting, HTML escaping, input validation |
| **Accessibility** | Skip-to-content link, ARIA labels, `prefers-reduced-motion` support |
| **Performance** | Dynamic imports for below-the-fold components, DNS prefetch, lazy loading |
| **SEO** | Open Graph / Twitter meta, JSON-LD structured data, sitemap, robots.txt |

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + custom design tokens
- **AI:** [Vercel AI SDK](https://sdk.vercel.ai/) + [Groq](https://groq.com/) (Llama 3.3 70B)
- **Forms:** React Hook Form + Zod 4
- **Email:** [Resend](https://resend.com/)
- **Scheduling:** [Cal.com Embed](https://cal.com/)
- **UI Primitives:** Base UI, CVA, Lucide Icons

## Architecture

```
src/
├── app/
│   ├── layout.tsx            # Root layout — metadata, JSON-LD, skip link
│   ├── page.tsx              # Landing page with dynamic imports
│   ├── error.tsx             # Global error boundary
│   ├── not-found.tsx         # Custom 404
│   ├── robots.ts             # SEO: robots.txt generation
│   ├── sitemap.ts            # SEO: XML sitemap generation
│   └── api/
│       ├── chat/route.ts     # AI chat endpoint (streaming, rate-limited)
│       └── lead/route.ts     # Lead form endpoint (validated, rate-limited)
├── components/
│   ├── header.tsx            # Sticky header with i18n language switcher
│   ├── hero.tsx              # Hero section with embedded chat
│   ├── footer.tsx            # Footer with legal resources & contact CTAs
│   ├── chat/
│   │   ├── chat-widget.tsx   # Streaming AI chat interface
│   │   └── diagnostic-card.tsx   # Structured diagnostic output
│   └── ui/                   # Reusable UI primitives (Button, Card, Input…)
└── lib/
    ├── utils.ts              # cn() helper (clsx + tailwind-merge)
    ├── rate-limit.ts         # Rate limiter (Upstash Redis in prod, in-memory fallback in dev)
    ├── ai/
    │   └── system-prompt.ts  # LLM system prompt with legal guardrails
    └── i18n/
        ├── context.tsx       # Locale provider (React Context)
        └── translations.ts   # ES / EN translation strings
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/<your-username>/defensaya.git
cd defensaya
npm install
```

### Environment Variables

Copy the example file and fill in your API keys:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | [Groq](https://console.groq.com/) API key |
| `GROQ_MODEL` | No | Groq model ID. Dev default: `llama-3.1-8b-instant`. **Set `llama-3.3-70b-versatile` in Vercel for production.** |
| `RESEND_API_KEY` | Yes | [Resend](https://resend.com/) API key for lead notification emails |
| `LEAD_NOTIFY_EMAIL` | No | Email address to receive lead notifications (defaults to repo owner) |
| `UPSTASH_REDIS_REST_URL` | Prod | [Upstash Redis](https://console.upstash.com/) REST URL for global rate limiting across serverless instances. Falls back to in-memory if not set. |
| `UPSTASH_REDIS_REST_TOKEN` | Prod | Upstash Redis REST token (write access, not read-only) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`). Analytics disabled if not set. |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical site URL for SEO (default: `https://defensaya.com`) |

### External Services

| Service | Purpose | Free Tier |
|---|---|---|
| [Groq](https://console.groq.com/) | LLM inference (Llama 3) | 100k tokens/day (dev), 500k with Dev Tier |
| [Resend](https://resend.com/) | Transactional email | 3,000 emails/month |
| [Upstash Redis](https://console.upstash.com/) | Global rate limiting | 10k requests/day |
| [Cal.com](https://cal.com/) | Scheduling embed | Free on hobby plan |
| [Google Analytics](https://analytics.google.com/) | Usage analytics | Free |
| [Vercel](https://vercel.com/) | Hosting & deployment | Free on hobby plan |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Security

- **Rate Limiting** — IP-based sliding-window limiter on all API routes (chat: 20 req/min, leads: 5 req/15 min). Uses [Upstash Redis](https://console.upstash.com/) in production for a global counter shared across all serverless instances; falls back to in-memory in dev/test.
- **Input Validation** — Zod schemas on every API endpoint; max message length enforced
- **HTML Escaping** — All user-provided content escaped before email rendering
- **Security Headers** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **No Secrets in Client** — API keys are server-side only via environment variables

## License

[MIT](./LICENSE)
