# ✅ NovaFlow — Production Launch Checklist

Run through this list before flipping the DNS. Items marked **✓ baked in**
ship with the repo as-is; the rest are config / ops choices you own.

> Need the *how* for any of these? See [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 🟣 1. Build & runtime

- [x] **Production build passes** — `npm run build` exits 0
- [x] **Strict TypeScript** — `npm run typecheck` is part of the build
- [x] **No dev-only deps bundled** — `mongodb-memory-server` externalized
- [x] **Source maps disabled** in prod (`productionBrowserSourceMaps: false`)
- [x] **`X-Powered-By` header removed** (`poweredByHeader: false`)
- [x] **gzip + brotli compression** (`compress: true`)
- [x] **Node runtime pinned** on every API route (`export const runtime = "nodejs"`)
- [x] **`dynamic = "force-dynamic"`** on every authenticated API route
- [ ] Pinned Node version in `package.json` `engines.node` (optional)

## 🔐 2. Security

- [x] **HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy** — set globally in `next.config.mjs`
- [x] **`AUTH_TRUST_HOST=true`** — required on Vercel
- [x] **`NEXTAUTH_SECRET`** ≥ 32 bytes — validated by `lib/env.ts`
- [x] **API routes return `Cache-Control: no-store`** — set globally
- [x] **API routes flagged `X-Robots-Tag: noindex`** — set globally
- [x] **Rate limiting** on AI chat (20/min), AI extract-tasks (10/min), signup (5/5min), forgot-password (3/5min), reset-password (10/5min)
- [x] **Password hashing** with `bcryptjs` (cost 12)
- [x] **Reset tokens are SHA-256 hashed + single-use + TTL-expired**
- [x] **Account-enumeration resistance** on `/api/auth/forgot-password`
- [x] **`requireSession()` guard** on every non-public API route
- [x] **CSRF protection** — built in to Auth.js v5 + same-site cookies
- [ ] Optional: tighten Content Security Policy via middleware nonce (currently relaxed for inline styles)
- [ ] Rotate `NEXTAUTH_SECRET` and OAuth client secrets quarterly
- [ ] Enable Vercel **Deployment Protection** for preview URLs
- [ ] Enable **MFA on the Vercel & Atlas accounts** that own the project

## 🗄️ 3. MongoDB Atlas

- [ ] Cluster region = Vercel function region (`iad1` default → `us-east-1`)
- [ ] Atlas IP allow list includes `0.0.0.0/0` (or PrivateLink configured)
- [ ] Atlas DB user has the **minimum** required role (`readWrite` on `novaflow`)
- [ ] DB password is **URL-encoded** in `MONGODB_URI`
- [ ] Cluster tier ≥ **M10** for production SLA + backups
- [ ] **Continuous Cloud Backup** enabled
- [x] Mongoose connection pool tuned for serverless (`maxPoolSize: 10`)
- [x] `serverSelectionTimeoutMS: 8000`, `socketTimeoutMS: 45000`
- [x] `bufferCommands: false` (fail fast instead of queueing)
- [x] All models declare proper indexes (`workspace`, `email`, `slug`, `tokenHash`)
- [x] TTL index on `PasswordResetToken.expiresAt`

## ⚡ 4. Performance

- [x] `next/font` for Inter / Space Grotesk / JetBrains Mono (no CLS, no extra request)
- [x] **AVIF + WebP** image formats enabled
- [x] `next/image` cache TTL = 7 days
- [x] `optimizePackageImports` for `lucide-react`, `framer-motion`, `recharts`, `react-syntax-highlighter`
- [x] **Skeleton loaders** instead of spinners on all data-bound pages
- [x] **Route-level page transitions** with `prefers-reduced-motion` respect
- [x] **`<PrismLight>` syntax highlighter** with only common langs registered (small bundle)
- [x] **SWR cache + `revalidateOnFocus: false`** prevents pointless refetches
- [x] Mongoose `lean()` on all read-heavy queries
- [ ] Run `npm run analyze` and inspect bundles before each major release
- [ ] Configure **Vercel Speed Insights** for field-level Web Vitals
- [ ] Set **OpenAI rate limits + budgets** in their dashboard

## 🔎 5. SEO & metadata

- [x] Root `<Metadata>` with title template, description, keywords, OG, Twitter card, robots
- [x] **Per-page `<Metadata>`** for Dashboard, Workspace, Team, Assistant, Analytics, Settings
- [x] `sitemap.ts` lists every public route
- [x] `robots.ts` allows all + references the sitemap
- [x] **Dynamic Open Graph image** (`opengraph-image.tsx`) — 1200×630 PNG
- [x] **PWA `manifest.ts`** — installable on mobile home screens
- [x] `metadataBase` + `NEXT_PUBLIC_APP_URL` for absolute URLs
- [ ] Add Google Search Console verification
- [ ] Submit `sitemap.xml` to Google + Bing
- [ ] Set up canonical URLs if you serve multiple domains

## 🎨 6. UX polish

- [x] **Toast notifications** on every mutation (success + error)
- [x] **Skeleton loaders** on all SWR-backed pages
- [x] **Empty states** with copy + CTA on every list
- [x] **Error boundaries** — global `error.tsx` + `(app)/error.tsx`
- [x] **Loading screens** — global `loading.tsx` + `(app)/loading.tsx`
- [x] **Branded 404 page** with aurora background
- [x] **Skip-to-content link** for keyboard users
- [x] **Visible focus ring** on every interactive element
- [x] `@media (prefers-reduced-motion: reduce)` honored everywhere
- [x] **Mobile drawer** for sidebar; topbar gains a scroll shadow

## 🩺 7. Observability

- [x] **`/api/health` endpoint** with DB ping + latency + region + commit
- [x] **Vercel cron** pings health every 15 minutes
- [x] **`AIHistory` collection** logs every AI call with cost + tokens + latency
- [x] **`Activity` collection** records every workspace event
- [x] Errors logged to `console.error` (visible in Vercel function logs)
- [ ] Wire **Sentry** for client + server error tracking
- [ ] Wire **BetterStack / Logtail** for log retention beyond 1 day
- [ ] Hook **Slack alerts** on `/api/health` failure
- [ ] Set up **uptime monitor** (BetterUptime, Pingdom) on `/api/health`

## 🌐 8. Domain & DNS

- [ ] Custom domain added in Vercel
- [ ] Apex (`novaflow.app`) → A record → `76.76.21.21`
- [ ] `www` subdomain → CNAME → `cname.vercel-dns.com`
- [ ] HTTPS auto-provisioned (Vercel handles Let's Encrypt)
- [ ] `NEXT_PUBLIC_APP_URL` matches the live domain
- [ ] Redirect `www.` → apex (or vice versa) — pick one canonical
- [ ] DNSSEC enabled on the registrar (optional, recommended)

## 💸 9. Cost guardrails

- [ ] OpenAI **monthly usage limit** set (hard cap)
- [ ] OpenAI **soft budget alert** at 50% of limit
- [ ] Atlas cluster auto-scaling **disabled** (or capped) unless reviewed
- [ ] Vercel team plan if you expect >1M function invocations / month

## 🧪 10. Pre-launch smoke test

Run after every deploy:

```bash
# Replace with your URL
APP=https://novaflow.app

# 1. Health
curl -sf $APP/api/health | jq -e '.status == "ok"'

# 2. SEO surface
curl -sIL $APP/sitemap.xml | grep -i content-type
curl -sIL $APP/opengraph-image | grep -i content-type
curl -sIL $APP/robots.txt | grep -i 200

# 3. Auth surface
curl -sf $APP/login | grep -q 'NovaFlow'
curl -sf $APP/api/auth/csrf | jq -e '.csrfToken | length > 30'

# 4. Security headers
curl -sI $APP/dashboard | grep -E '(Strict-Transport|X-Frame|X-Content|Referrer-Policy)'
```

## 🚦 11. Go-live gates

Don't deploy to production unless **every** of these is true:

- [ ] `npm run typecheck` ✓
- [ ] `npm run build` ✓
- [ ] All 🟣 items checked
- [ ] All 🔐 items checked
- [ ] All 🗄️ items checked
- [ ] DNS verified (`dig novaflow.app +short` returns Vercel IP)
- [ ] `/api/health` returns 200 with `db: "connected"`
- [ ] You can sign in, create a project, drag a task to "Shipped", and see the toast

---

🎉 If everything's checked, you're ready to ship. Welcome to production.
