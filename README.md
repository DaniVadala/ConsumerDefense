# DefensaYa — AI Consumer Rights Advisor

**DefensaYa** is an AI-powered platform that helps Argentine consumers understand their legal rights. Users describe their problem in natural language through a chat interface; the assistant is guided by a single Markdown instruction file, streams replies with the Vercel AI SDK, and keeps the conversational thread in the model context (no server-side session store).

> **Live demo →** [defensaya.com](https://defensaya.com)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-6-000?logo=vercel)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?logo=openai&logoColor=white)

---

## Features

| Feature | Description |
|---|---|
| **AI assistant** | OpenAI (default `gpt-4o`) with instructions from `src/lib/prompts/consumidor-chat-instructions.md`, streamed through the Vercel AI SDK and Assistant UI |
| **Lawyer Referral Network** | `/abogados` page + `/api/lawyers-waitlist` endpoint for qualified lawyers to join the referral network |
| **IP Hashing** | Rate-limit Redis keys use HMAC-SHA256 hashed IPs — raw IP addresses are never stored |
| **ARCO / end chat** | `POST /api/session/delete` — client-side session identifier only (no server-side chat transcript store) |
| **Rate Limiting** | IP-based limiter: 3 new conversations/day (general), plus stricter optional outcome counters; resettable via admin endpoint for testing |
| **Lead Capture** | React Hook Form + Zod modal with Resend email notification |
| **Cal.com Integration** | Lazy-loaded scheduling embed for free lawyer consultations |
| **i18n** | Spanish / English support via React Context |
| **SEO** | Open Graph, Twitter card, JSON-LD structured data, XML sitemap, robots.txt |
| **Accessibility** | Skip-to-content link, semantic HTML, ARIA labels, `prefers-reduced-motion` support |
| **Performance** | Dynamic imports for below-the-fold sections, DNS prefetch, `next/image` with WebP/AVIF |
| **Security** | CSP headers, HSTS, CORS control, input normalization, HTML escaping |

---

## Tech Stack

### Core Framework

| Technology | Version | Role |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 (App Router) | Full-stack React framework, API routes, SSR/SSG |
| [React](https://react.dev/) | 19 | UI library — Server Components + Client Components |
| [TypeScript](https://www.typescriptlang.org/) | 5 (strict) | Type safety across the full stack |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility-first styling with custom design tokens |

### AI & assistant

| Technology | Version | Role |
|---|---|---|
| [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`) | 6 | `streamText()`, UIMessage streaming via `toUIMessageStreamResponse`, `convertToModelMessages` |
| [`@ai-sdk/openai`](https://sdk.vercel.ai/providers/ai-sdk-providers/openai) | 3 | OpenAI provider adapter for the Vercel AI SDK |
| [OpenAI API](https://platform.openai.com/) | — | Chat model: `gpt-4o` (`src/lib/chat/llm-config.ts`) |
| [Upstash Redis](https://upstash.com/) (`@upstash/redis`) | 1.37 | Serverless Redis for **rate limit** (and optional outcome) counters only — not for chat state |
| [Zod](https://zod.dev/) | 4 | API request / message validation at the edge of `/api/chat` |
| [UUID](https://github.com/uuidjs/uuid) | 13 | Client-side session id sent to the API (no server store) |

### Chat UI

| Technology | Version | Role |
|---|---|---|
| [`@assistant-ui/react`](https://github.com/assistant-ui/assistant-ui) | 0.12 | Headless chat primitives (thread, message, input) |
| [`@assistant-ui/react-ai-sdk`](https://github.com/assistant-ui/assistant-ui) | 1.3 | Connects assistant-ui to the Vercel AI SDK UIMessage stream |

### Forms & Validation

| Technology | Version | Role |
|---|---|---|
| [React Hook Form](https://react-hook-form.com/) | 7 | Uncontrolled form state management |
| [`@hookform/resolvers`](https://github.com/react-hook-form/resolvers) | 5 | Zod resolver for React Hook Form |
| [Zod](https://zod.dev/) | 4 | Schema definition and runtime validation |

### UI Primitives

| Technology | Version | Role |
|---|---|---|
| [`@base-ui/react`](https://base-ui.com/) | 1.3 | Unstyled, accessible UI primitives |
| [Lucide React](https://lucide.dev/) | 1.7 | Icon library |
| [`class-variance-authority`](https://cva.style/) | 0.7 | Type-safe component variant system |
| [`clsx`](https://github.com/lukeed/clsx) + [`tailwind-merge`](https://github.com/dcastil/tailwind-merge) | — | Conditional class merging utility (`cn()`) |

### External Services

| Technology | Version | Role |
|---|---|---|
| [Resend](https://resend.com/) | 6 | Transactional email for lead form notifications |
| [Cal.com Embed](https://cal.com/docs/embed/quick-start) (`@calcom/embed-react`) | 1.5 | Lazy-loaded scheduling modal |
| [Google Analytics 4](https://analytics.google.com/) | — | Page view and event tracking (`next/script`, afterInteractive) |

### Tooling

| Technology | Version | Role |
|---|---|---|
| [ESLint](https://eslint.org/) | 9 | Linting with `eslint-config-next` (core-web-vitals + typescript) |
| [PostCSS](https://postcss.org/) | — | CSS processing for Tailwind 4 |

---

## Chat architecture (evolution)

Earlier designs put **one model in charge of everything** each turn: infer missing fields, order questions, call the right UI tools, handle edge cases, and write natural language. That stack was **bug-prone** (wrong tool / no tool, repeated questions, fragile “biconditional” rules in prompts) and hard to reason about.

**Current approach (intake):** a **split pipeline** in [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts) with dedicated modules under [`src/lib/chat/`](src/lib/chat/):

1. **Layer 1 — `generateObject` + Zod** ([`intake-extractor.ts`](src/lib/chat/intake-extractor.ts)) — one small structured read of the thread (inventory + message classification), no user-facing text.
2. **Orchestrator (TypeScript)** ([`intake-orchestrator.ts`](src/lib/chat/intake-orchestrator.ts), [`session-map.ts`](src/lib/chat/session-map.ts)) — deterministic `next` action: which field to ask, diagnosis, or cut (insult, scope, stuck field, etc.); session counters in memory (TTL) instead of “prompt memory.”
3. **Layer 2 — `streamText`** — runs only with a **server-injected directive** ([`intake-directive.ts`](src/lib/chat/intake-directive.ts) + system instructions) so the model **executes** a fixed instruction instead of re-deriving the whole flow. Optional sanitization and trimming of the last user message on cuts limit prompt-injection and tone bleed.

**Why it works better:** *control flow lives in code*; the LLM mainly **phrases** questions and the diagnosis. *Why the old way failed:* a single free-form pass mixed planning and tool use, so small prompt or model changes caused regressions and loops (e.g. same field asked forever without session-level “stuck” state).

*Older planning notes and ad-hoc product specs were removed from the repo; this section is the compact replacement.*

## Chat assistant

The [POST `/api/chat`](src/app/api/chat/route.ts) route loads the system instructions from [`src/lib/prompts/consumidor-chat-instructions.md`](src/lib/prompts/consumidor-chat-instructions.md) and streams the model reply with the Vercel AI SDK and Assistant UI. The client sends the UIMessage history; there is no Redis-backed **conversation** state for the model on the server (only rate-limit / optional outcome counters in Redis, same as before).

### Rate limiting

See [`src/lib/rate-limiter.ts`](src/lib/rate-limiter.ts) — IP-hashed keys in Upstash Redis (or in-memory in dev), daily rolling windows, admin reset at `POST /api/admin/reset-rate-limit` for testing.

### Local testing: reset rate limits

### How to reset a rate-limit block (for testing)

> Use this when you want to test the rate-limiting behavior multiple times without the bypass token, or when you want to clear a block on a specific IP.

**Step 1 — Find your IP**

Open the browser and visit `https://api.ipify.org` (or check server logs). Copy your public IP.

**Step 2 — Send the reset request**

```bash
curl -X POST https://defensaya.com/api/admin/reset-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_RATE_LIMIT_BYPASS_TOKEN", "ip": "YOUR_IP"}'
```

Or from the browser console (on any DefensaYa page):

```js
fetch('/api/admin/reset-rate-limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: 'YOUR_RATE_LIMIT_BYPASS_TOKEN', ip: '1.2.3.4' })
}).then(r => r.json()).then(console.log);
```

**What gets reset:**

| Counter | Effect |
|---|---|
| `rl:conv:{ip}` | Allows starting new conversations again (general quota) |
| `rl:nc:{ip}` | Clears the non-conducive outcome block |
| `rl:ab:{ip}` | Clears the abusive outcome block |

**Step 3 — Reload the page**

After the reset, reload the browser tab. The hero CTA will show "Empezá tu análisis gratis" again.

> **Note:** The bypass token (`?bypass=TOKEN` in the URL) skips all limits entirely and never increments any counter — useful for demos and automated testing. The reset endpoint is for testing the limits themselves.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — Geist font, metadata, JSON-LD, skip link
│   ├── page.tsx                # Landing page — dynamic imports for all below-the-fold sections
│   ├── globals.css             # Tailwind 4 base + custom design tokens
│   ├── error.tsx               # Global error boundary with reset()
│   ├── not-found.tsx           # Custom 404
│   ├── robots.ts               # Dynamic robots.txt
│   ├── sitemap.ts              # Dynamic XML sitemap
│   ├── abogados/page.tsx       # Lawyer referral landing page (/abogados)
│   └── api/
│       ├── chat/route.ts       # AI chat (streamText + Markdown base, rate-limited)
│       ├── lead/route.ts       # Lead form endpoint (Resend email, rate-limited)
│       ├── lawyers-waitlist/route.ts  # Lawyer signup endpoint (Resend notification)
│       ├── session/
│       │   └── delete/route.ts # Client session id — no server transcript store
│       └── admin/
│           └── reset-rate-limit/route.ts  # Reset IP rate-limit counters (testing only)
│
├── components/
│   ├── layout/
│   │   ├── header.tsx          # Sticky header with language switcher
│   │   └── footer.tsx          # Footer with legal resources & contact CTAs
│   ├── sections/
│   │   ├── hero.tsx            # Hero — dual-layout (mobile/desktop), embedded chat
│   │   ├── trust-signals.tsx   # Social proof section
│   │   ├── steps-section.tsx   # How-it-works steps
│   │   ├── info-section.tsx    # Informational content
│   │   ├── about-qualifai.tsx  # About the company
│   │   └── pre-footer-cta.tsx  # Pre-footer call-to-action
│   ├── chat/
│   │   ├── thread.tsx                # ChatContainer — Assistant UI + transport
│   │   ├── quick-reply-pills.tsx     # (reservado; sin pills — flujo 100% modelo)
│   │   ├── intake-step-stream-context.tsx
│   │   └── intake-contextual-ui.tsx
│   ├── analytics/
│   │   ├── google-analytics.tsx # GA4 script injection via next/script (afterInteractive)
│   │   └── analytics-provider.tsx # Route change tracking
│   ├── ui/                     # Reusable UI primitives (Button, Card, Badge, Input, etc.)
│   ├── cal-modal.tsx           # Cal.com embed + useCalModal hook
│   ├── lead-form.tsx           # Lead capture modal (native <dialog>)
│   └── whatsapp-fab.tsx        # Floating WhatsApp action button
│
├── lib/
│   ├── utils.ts                # cn() helper (clsx + tailwind-merge)
│   ├── analytics.ts            # Typed GA4 event wrappers
│   ├── chat-availability-context.tsx  # Context: chat state + reset + rate-limit flag
│   ├── i18n/
│   │   ├── context.tsx         # LocaleProvider + useLocale hook
│   │   └── translations.ts     # ES / EN translation strings
│   ├── prompts/
│   │   ├── consumidor-chat-instructions.md  # Instrucciones del asistente (fuente de verdad)
│   │   └── load-chat-instructions.ts
│   ├── chat/
│   │   └── llm-config.ts       # max tokens, temperature, default model
│   ├── rate-limiter.ts         # IP-hashed rate limits (Upstash or in-memory)
│   ├── hash-ip.ts              # HMAC-SHA256 for rate-limit keys
│   └── rate-limits.ts          # Thresholds for optional outcome checks
│
└── scripts/
    └── check-versions.ts       # Validates installed package versions (see package-versions.json)
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm (or pnpm / yarn)

### Installation

```bash
git clone https://github.com/<your-username>/defensaya.git
cd defensaya
npm install
```

### Environment Variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | **Yes** | [OpenAI](https://platform.openai.com/api-keys) API key |
| `UPSTASH_REDIS_REST_URL` | Prod | [Upstash Redis](https://console.upstash.com/) REST URL. Falls back to in-memory if not set. |
| `UPSTASH_REDIS_REST_TOKEN` | Prod | Upstash Redis REST token |
| `RESEND_API_KEY` | Yes | [Resend](https://resend.com/) key for lead notification emails |
| `LEAD_NOTIFY_EMAIL` | Yes | Email address to receive lead submissions |
| `IP_HASH_SECRET` | **Prod** | Secret for HMAC-SHA256 IP hashing on rate-limit keys. Generate: `openssl rand -base64 48` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics 4 ID (`G-XXXXXXXXXX`). Disabled if not set. |
| `NEXT_PUBLIC_SITE_URL` | No | Canonical URL for SEO. Default: `https://defensaya.com` |
| `MAINTENANCE_MODE` | No | Set `true` to show a maintenance page. |
| `RATE_LIMIT_BYPASS_TOKEN` | No | Secret token to bypass chat rate limits for testing. |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other Scripts

```bash
npm run build          # Production build
npm start              # Start production server
npm run lint           # ESLint
npm run check-versions # Verify installed package versions
```

---

## External Services

| Service | Purpose | Free Tier |
|---|---|---|
| [OpenAI](https://platform.openai.com/) | LLM inference | Pay-as-you-go |
| [Upstash Redis](https://console.upstash.com/) | Rate limiting (optional; in-memory fallback locally) | 10,000 req/day |
| [Resend](https://resend.com/) | Transactional email for leads | 3,000 emails/month |
| [Cal.com](https://cal.com/) | Scheduling embed for lawyer consultations | Free on hobby plan |
| [Google Analytics](https://analytics.google.com/) | Usage analytics | Free |
| [Vercel](https://vercel.com/) | Hosting & deployment | Free on hobby plan |

---

## Security

- **Rate Limiting** — IP-based (chat): 3 conversations/day general; 2/day if outcomes are non-conducive; 1/day if outcomes are abusive (insult/absurd). Lead form: 5 submissions per 15 min. Admin endpoint to reset counters for testing (requires bypass token).
- **Input Guardrails** — Normalization, PII redaction, turn cap, OpenAI Moderation API, local jailbreak regex.
- **Content-Security-Policy** — Configured (report-only) for all routes: restricts scripts, frames, and connects to known origins only.
- **HSTS** — `max-age=63072000; includeSubDomains; preload` in production.
- **Security Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `poweredByHeader: false`.
- **No secrets in client** — All API keys are server-side environment variables only.
- **HTML escaping** — All user content escaped before email rendering in the lead route.
- **Zod validation** — Every API endpoint validates its request body against a strict schema before any processing.

---

## License

[MIT](./LICENSE)
