# 🚀 NovaFlow — Vercel Deployment Guide

End-to-end walkthrough for deploying NovaFlow to Vercel with
production-grade MongoDB Atlas, secure secrets, and the right caching
and security headers in place.

> **TL;DR** — Push to GitHub → import to Vercel → paste the env vars
> from [`.env.example`](.env.example) → Deploy. NovaFlow ships with a
> `vercel.json` that handles function regions, memory, and cron health
> checks automatically.

---

## 1. Pre-flight — what you need

- A **GitHub** account (or GitLab / Bitbucket)
- A **Vercel** account ([vercel.com](https://vercel.com))
- A **MongoDB Atlas** cluster (free M0 tier is fine to start)
- *(Optional)* Google / GitHub OAuth app credentials
- *(Optional)* OpenAI API key

⏱ Estimated time: **10–15 minutes** end-to-end.

---

## 2. Provision MongoDB Atlas

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a user with **Read and write to any
   database**. Save the password somewhere safe.
3. Under **Network Access**, add `0.0.0.0/0` to the IP allow list.
   Vercel functions have ephemeral IPs — locking down by IP requires
   [Vercel Secure Compute](https://vercel.com/docs/security/secure-compute)
   or Atlas Private Endpoints.
4. Click **Connect → Drivers** and copy the connection string. It looks
   like:
   ```
   mongodb+srv://novaflow:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your user password. URL-encode any special
   characters (`@`, `:`, `/`, etc.).

> 🛡️ **Recommended Atlas settings for production:**
> - Enable **Backup** (`M10+` tier)
> - Enable **Performance Advisor** alerts
> - Set the **cluster tier** to `M10` or higher for low-latency / SLA
> - Pin the cluster region to the same region as your Vercel functions
>   (default `iad1` = `us-east-1` for both)

---

## 3. (Optional) OAuth providers

### Google
1. Go to <https://console.cloud.google.com/apis/credentials>
2. **Create OAuth client ID** → **Web application**
3. **Authorized redirect URIs**:
   ```
   https://<your-domain>/api/auth/callback/google
   https://<project>.vercel.app/api/auth/callback/google
   ```
4. Copy the **Client ID** and **Client Secret**.

### GitHub
1. Go to <https://github.com/settings/developers>
2. **New OAuth App**
3. **Authorization callback URL**:
   ```
   https://<your-domain>/api/auth/callback/github
   ```
4. Copy the **Client ID** and generate a **Client Secret**.

---

## 4. (Optional) OpenAI API key

1. Get a key at <https://platform.openai.com/api-keys>.
2. NovaFlow defaults to `gpt-4o-mini` — cheap, fast, and excellent for
   workspace assistance. Override with `OPENAI_MODEL=gpt-4.1-mini` etc.

> 💡 Without an `OPENAI_API_KEY`, the assistant still works — it
> streams a contextual mock reply. Great for demo deployments.

---

## 5. Deploy to Vercel

### Option A — One-click via GitHub (recommended)
1. **Push** your fork to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository**.
3. Select the repo. Vercel auto-detects Next.js.
4. **Environment Variables** — paste these (see [§ 6](#6-environment-variables) for the full table):

   | Name | Value |
   |---|---|
   | `DEMO_MODE` | `false` |
   | `MONGODB_URI` | your Atlas connection string |
   | `MONGODB_DB` | `novaflow` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` output |
   | `AUTH_TRUST_HOST` | `true` |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` |
   | *(opt.)* `AUTH_GOOGLE_ID` | … |
   | *(opt.)* `AUTH_GOOGLE_SECRET` | … |
   | *(opt.)* `AUTH_GITHUB_ID` | … |
   | *(opt.)* `AUTH_GITHUB_SECRET` | … |
   | *(opt.)* `OPENAI_API_KEY` | `sk-proj-…` |
   | *(opt.)* `OPENAI_MODEL` | `gpt-4o-mini` |

5. Click **Deploy** → wait ~90 seconds → ✅ done.

### Option B — CLI
```bash
npm i -g vercel
vercel login
vercel link
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_SECRET production
# …repeat for the rest
vercel deploy --prod
```

### Option C — Preview deployment (no Atlas needed)
Set `DEMO_MODE=true` and skip `MONGODB_URI`. Each preview spins up its
own ephemeral in-memory MongoDB and auto-seeds the demo data. Perfect
for sharing branches with stakeholders.

---

## 6. Environment variables

The full annotated list lives in [`.env.example`](.env.example). Quick
reference of what's **required vs optional** for Vercel:

| Variable | Required? | Used by |
|---|---|---|
| `DEMO_MODE` | required (set to `false` in prod) | runtime mode |
| `MONGODB_URI` | required (when `DEMO_MODE=false`) | mongoose |
| `MONGODB_DB` | optional (default `novaflow`) | mongoose |
| `NEXTAUTH_SECRET` | **required** | Auth.js cookie encryption |
| `AUTH_TRUST_HOST` | **required** (`true`) | proxy header trust |
| `NEXTAUTH_URL` | optional on Vercel (auto-detected) | OAuth callbacks |
| `NEXT_PUBLIC_APP_URL` | recommended | sitemap, OG, toasts |
| `AUTH_GOOGLE_ID` / `_SECRET` | optional | Google sign-in |
| `AUTH_GITHUB_ID` / `_SECRET` | optional | GitHub sign-in |
| `OPENAI_API_KEY` | optional | real AI replies |
| `OPENAI_MODEL` | optional (default `gpt-4o-mini`) | model selection |

> ⚠️ NovaFlow **validates the environment at boot** using `src/lib/env.ts`.
> A misconfigured deployment will fail loudly in the Vercel function
> logs with a readable error — not silently 500 on the first request.

---

## 7. Custom domain

1. In Vercel project → **Settings → Domains** → **Add**.
2. Point your DNS:
   - **Apex domain** (`novaflow.app`) → A record → `76.76.21.21`
   - **www / sub-domain** → CNAME → `cname.vercel-dns.com`
3. Update `NEXT_PUBLIC_APP_URL` to the new domain and redeploy.
4. Vercel auto-provisions Let's Encrypt TLS within ~60 s.

---

## 8. Post-deploy verification

```bash
# Health check (returns 200 with DB latency, region, commit, etc.)
curl https://<your-domain>/api/health | jq

# Sitemap
curl https://<your-domain>/sitemap.xml

# Open Graph image (renders edge — should return a PNG)
curl -I https://<your-domain>/opengraph-image

# Sign in with the demo seeded account (only works in DEMO_MODE)
#   email:    demo@novaflow.app
#   password: novaflow123
```

A `vercel.json` cron pings `/api/health` every **15 minutes** to keep
Vercel function warm-up minimal — adjust in `vercel.json` if you prefer
fewer wakeups.

---

## 9. Performance + caching strategy

NovaFlow ships with conservative defaults that you can crank up later:

| Layer | Setting | Effect |
|---|---|---|
| Static assets (`/_next/static/*`) | `public, max-age=31536000, immutable` | Permanent browser cache |
| API responses (`/api/*`) | `no-store, must-revalidate` | Never stale, never CDN-cached |
| Images (`next/image`) | AVIF/WebP, 7-day cache | Smallest payload across devices |
| Demo seed (in `DEMO_MODE`) | idempotent on boot | One spin-up per deploy |
| Mongoose pool | `maxPoolSize=10` | Tuned for Vercel concurrency |

Want even faster? See **Performance optimization** in
[`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md).

---

## 10. Observability

- **Vercel Logs** → real-time function logs (free).
- **Vercel Analytics** → Web Vitals, traffic. Enable in Project Settings.
- **Vercel Speed Insights** → field RUM. One-line install.
- **MongoDB Atlas Performance Advisor** → slow query alerts, index hints.
- **OpenAI Usage Dashboard** → spend + per-key quota.

Hook external observability:

| Tool | Where |
|---|---|
| **Sentry** | Add `@sentry/nextjs`, wrap `instrumentation.ts` |
| **Logtail / BetterStack** | Pipe `process.stderr` from Vercel via log drains |
| **PostHog** | Add `posthog-js` in `src/components/providers.tsx` |

---

## 11. Going off Vercel?

The app is portable — anywhere Node 20+ + MongoDB runs:

```bash
# Docker
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=$MONGODB_URI \
  -e NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
  -e AUTH_TRUST_HOST=true \
  -e DEMO_MODE=false \
  ghcr.io/<you>/novaflow:latest

# Plain Node
npm ci && npm run build && npm start
```

The only Vercel-specific feature is the dynamic `opengraph-image.tsx`
edge runtime — it falls back gracefully on other platforms (renders on
serverless Node instead).

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| **500 on first request after deploy** | `NEXTAUTH_SECRET` missing — check Vercel env vars, redeploy |
| **OAuth redirects to `localhost`** | `AUTH_TRUST_HOST=true` not set, or `NEXTAUTH_URL` points to localhost |
| **MongoDB timeout** | Add `0.0.0.0/0` to Atlas Network Access, or check the password is URL-encoded |
| **"AI rate limit reached"** | Working as intended — the IP hit the per-minute limit. Tune in `src/lib/rate-limit.ts` |
| **Open Graph image is blank** | Edge runtime needs `next/og` v14+ (NovaFlow uses Next 15) — clear Vercel cache and redeploy |
| **Demo data missing after deploy** | `DEMO_MODE` is set to `false` but `MONGODB_URI` is empty. Pick one or the other. |

Open an issue with the **request id** from the failing response — it
ties every log line in Vercel back to a single trace.

---

## What's next?

- ✅ Read [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) before going live
- 🧪 Run `npm run analyze` locally to inspect the bundle
- 📈 Wire up Vercel Analytics + Speed Insights
- 🔒 Roll the `NEXTAUTH_SECRET` quarterly
- 💸 Set OpenAI usage limits in their dashboard
