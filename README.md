# NovaFlow

> An AI-powered workspace collaboration platform — the cinematic, premium, dark-mode home where modern teams plan, build, and ship.

NovaFlow is a production-ready Next.js 15 frontend that bundles a marketing site, full auth flow, and a complete in-app experience (Dashboard, Workspace, AI Assistant, Analytics, Settings) — all glued together by a single design system with glassmorphism, neon gradients, smooth motion, and accessible defaults.

---

## Highlights

- **Cinematic dark UI** — Apple × Linear × Stripe aesthetics, custom aurora backgrounds, animated gradients, micro-interactions.
- **Reusable design system** — tokens-driven Tailwind config, glass primitives, animated counters, gradient text, focus-ring helpers.
- **Real charts** — animated Recharts area/bar/line/radial/pie visualizations with custom gradient fills and themed tooltips.
- **Realistic dashboard** — KPI counters, AI insight banner, activity timeline, kanban board, team members, billing.
- **AI Assistant** — full chat surface with conversation rail, typing indicator, suggested prompts, and workspace context badge.
- **Marketing site** — animated hero with a realistic in-product preview, marquee logo cloud, feature grid, 4-step workflow, pricing toggle, testimonials, and final CTA.
- **Auth pages** — split-screen with floating cards, social sign-in, premium typography.
- **Responsive** — mobile-first, collapsible sidebar with a drawer on mobile, fluid grids everywhere.
- **SEO** — metadata API, sitemap, robots, Open Graph, structured headings.
- **A11y** — semantic markup, focus rings, ARIA labels, keyboard-friendly composer.
- **Fast** — typecheck and production build both green; charts and motion lazy-rendered, optimized package imports.

---

## Tech Stack

| Layer       | Tooling                                                         |
| ----------- | --------------------------------------------------------------- |
| Framework   | **Next.js 15** (App Router, RSC)                                |
| Language    | **TypeScript 5**                                                |
| Styling     | **Tailwind CSS 3.4** + custom design tokens                     |
| Components  | **Radix UI** primitives + custom shadcn-style wrappers          |
| Motion      | **Framer Motion 11**, GSAP-ready                                |
| Charts      | **Recharts 2**                                                  |
| Icons       | **lucide-react**                                                |
| Fonts       | Inter (sans), Space Grotesk (display), JetBrains Mono (mono)    |
| Database    | **MongoDB** via **Mongoose 8** (ODM)                            |
| Auth        | **Auth.js (NextAuth v5)** + `@auth/mongodb-adapter`             |
| Validation  | **Zod 3**                                                       |
| Data fetch  | **SWR 2** (client cache + revalidation)                         |

---

## Getting Started

### Fastest path — Demo Mode (zero setup)

The repo ships with a **demo mode** that runs a real MongoDB binary
*in-process* (via `mongodb-memory-server`) and auto-seeds a sample
workspace on first request. No Docker, no Atlas, no install.

```bash
npm install
cp .env.example .env.local      # already defaults to DEMO_MODE=true
npm run dev                     # → http://localhost:3000
```

First request triggers a one-time MongoDB binary download (~80 MB,
cached in your home dir). Then log in with:

```
demo@novaflow.app  /  novaflow123
```

### Production path — real MongoDB

```bash
# 1. Install
npm install

# 2. Set up environment
cp .env.example .env.local
#   Set DEMO_MODE=false
#   Fill in MONGODB_URI and NEXTAUTH_SECRET (mandatory)
#   Optionally add AUTH_GOOGLE_* / AUTH_GITHUB_* for social sign-in

# 3. (Optional) Seed demo data
npm run seed
#   Creates a demo workspace, projects, kanban tasks, and one chat.
#   Login: demo@novaflow.app  /  novaflow123

# 4. Start dev server
npm run dev
#   → http://localhost:3000

# 5. Production
npm run build && npm run start
```

### MongoDB setup (when DEMO_MODE=false)

You can use a local MongoDB instance or a managed Atlas cluster — the app
auto-creates indexes and bootstraps a workspace for every new user.

**Local (Docker)**

```bash
docker run -d --name novaflow-mongo -p 27017:27017 mongo:7
# then in .env.local:
# MONGODB_URI=mongodb://localhost:27017
# MONGODB_DB=novaflow
```

**MongoDB Atlas**

1. Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Add your IP to the network access list, create a DB user, copy the
   connection string.
3. Paste it into `.env.local` as `MONGODB_URI`.

### Generate a NextAuth secret

```bash
# macOS / Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Auth route group: /login, /signup
│   ├── (app)/                   # Authenticated app: dashboard, workspace, analytics, assistant, settings
│   ├── api/                     # Route handlers
│   │   ├── auth/[...nextauth]/  # NextAuth handlers
│   │   ├── signup/              # POST: create user + workspace (bcrypt)
│   │   ├── projects/            # GET (list) · POST (create) · PATCH/DELETE [id]
│   │   ├── tasks/               # GET · POST · PATCH/DELETE [id] (move column, toggle done)
│   │   └── conversations/       # GET · POST · DELETE [id] · POST [id]/messages
│   ├── layout.tsx               # Root: fonts, metadata, Providers
│   ├── page.tsx                 # Landing page
│   ├── not-found.tsx
│   ├── sitemap.ts / robots.ts   # SEO
│   └── globals.css              # Design tokens · glass · grid · aurora
│
├── components/
│   ├── ui/                      # Reusable primitives (Button, Card, Glass, Input, …)
│   ├── effects/                 # AuroraBackground, Spotlight, Marquee, Reveal
│   ├── marketing/               # Hero, HeroPreview, LogoCloud, Features, Workflow, Pricing, Testimonials, CTA, Navbar, Footer
│   ├── app/                     # AppShell, Sidebar, Topbar (session-aware)
│   ├── dashboard/               # StatCard, RevenueChart, ActivityFeed, TasksCard, TeamProgress, AIInsight
│   ├── workspace/               # ProjectCard, KanbanLive (drag-and-drop), NewProjectDialog, TeamMembers
│   ├── analytics/               # BigAreaChart, FunnelBars, RetentionLine, SourceDonut
│   ├── auth/                    # AuthLayout, SocialButtons (signIn-wired)
│   └── providers.tsx            # SessionProvider + SWRConfig
│
├── models/                      # Mongoose schemas
│   ├── User.ts, Workspace.ts, Project.ts, Task.ts
│   ├── Conversation.ts, Message.ts, Activity.ts
│
├── lib/
│   ├── mongodb.ts               # Mongoose connection (cached for HMR)
│   ├── mongodb-client.ts        # Native MongoClient promise for NextAuth adapter
│   ├── demo-mongo.ts            # In-memory MongoDB for DEMO_MODE
│   ├── demo-seed.ts             # Idempotent demo workspace seeder
│   ├── workspace.ts             # getOrCreateDefaultWorkspace(userId)
│   ├── api.ts                   # requireSession() + error helpers
│   ├── project-icons.tsx        # Icon name → Lucide component
│   └── utils.ts                 # cn(), formatters, initials()
│
├── scripts/
│   └── seed.ts                  # npm run seed → demo user + data
│
├── config/nav.ts                # Sidebar nav groups
├── auth.ts                      # Full NextAuth config (adapter + providers)
├── auth.config.ts               # Edge-safe config (used by middleware)
├── instrumentation.ts           # Boot hook: starts demo MongoDB once
└── middleware.ts                # Route protection
```

---

## Design System

Everything is tokenized in `tailwind.config.ts` + CSS variables in `src/app/globals.css`.

- **Color tokens** — HSL CSS variables (`--background`, `--foreground`, `--primary`, …) with a `nova-*` brand palette (`violet`, `fuchsia`, `cyan`, `blue`, `mint`, `amber`, `rose`).
- **Typography** — `font-sans` (Inter), `font-display` (Space Grotesk), `font-mono` (JetBrains Mono).
- **Surfaces** — `.glass`, `.glass-strong`, `.border-gradient`, `.bg-grid`, `.aurora`.
- **Gradients** — `.text-gradient-nova`, `bg-nova-gradient`, `bg-nova-gradient-soft`.
- **Shadows** — `shadow-glow`, `shadow-glow-cyan`, `shadow-glow-fuchsia`.
- **Motion** — `animate-float`, `animate-pulse-glow`, `animate-shimmer`, `animate-aurora`, `animate-marquee`.

---

## Routes

### Pages

| Route        | Description                                          | Backend |
| ------------ | ---------------------------------------------------- | ------- |
| `/`          | Landing page (hero, features, workflow, pricing, …) | —       |
| `/login`     | Real credentials login + Google/GitHub OAuth        | ✓        |
| `/signup`    | Real signup → workspace bootstrap + auto-login      | ✓        |
| `/dashboard` | KPI dashboard with AI insight + charts + tasks       | seeded  |
| `/workspace` | Projects + **live kanban** (drag-and-drop) + members | ✓ DB    |
| `/assistant` | Nova AI chat — conversations + messages persisted    | ✓ DB    |
| `/analytics` | Charts, AI insights, retention, sources, geo         | seeded  |
| `/settings`  | Profile, Preferences, Notifications, Billing, Security | UI    |

All authenticated routes are guarded by `src/middleware.ts` — unauthenticated
users are bounced to `/login?callbackUrl=…`.

### API Routes

| Method · Path                              | Purpose                                      |
| ------------------------------------------ | -------------------------------------------- |
| `POST /api/signup`                         | Create user + bootstrap workspace            |
| `GET/POST /api/auth/[...nextauth]`         | NextAuth handlers (credentials + OAuth)      |
| `GET/POST /api/projects`                   | List / create projects in current workspace  |
| `PATCH/DELETE /api/projects/[id]`          | Update (status, progress, starred) / delete |
| `GET/POST /api/tasks?projectId=…`          | List / create tasks                          |
| `PATCH/DELETE /api/tasks/[id]`             | Move column, toggle done, delete             |
| `GET/POST /api/conversations`              | List / start new AI conversation             |
| `GET/DELETE /api/conversations/[id]`       | Fetch messages / delete                      |
| `POST /api/conversations/[id]/messages`    | Send message + persist assistant reply       |

---

## Scripts

```bash
npm run dev        # next dev
npm run build      # next build
npm run start      # next start
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
npm run seed       # populate demo workspace + data
```

---

## Data Model (MongoDB collections)

| Collection      | Highlights                                                              |
| --------------- | ----------------------------------------------------------------------- |
| `users`         | name, email (unique), passwordHash (select: false), defaultWorkspace    |
| `workspaces`    | name, slug (unique), owner, members[{ user, role }]                     |
| `projects`      | name, description, icon, color, status, progress, starred, members[]    |
| `tasks`         | title, project, workspace, column, priority, tag, assignees[], order    |
| `conversations` | user, title, preview, messageCount, lastMessageAt                       |
| `messages`      | conversation, role (user/assistant/system), content, meta               |
| `activities`    | workspace, actor, type, text, refType, refId                            |

Plus the standard NextAuth-managed collections (`accounts`, `sessions`,
`verification_tokens`) maintained by `@auth/mongodb-adapter`.

---

## Next Steps

1. **Wire a real LLM** — replace `generateAssistantReply` in
   `src/app/api/conversations/[id]/messages/route.ts` with a call to your
   provider (OpenAI, Anthropic, Groq, etc.). For streaming, switch the
   handler to a `ReadableStream` response.
2. **Real analytics** — wire `/analytics` to live aggregations by adding an
   `events` collection and writing events from every API mutation.
3. **Dashboard tasks** — `TasksCard` currently uses local seed data; swap to
   `useSWR("/api/tasks?projectId=…")` + a small `PATCH` for toggle/done.
4. **Email + password recovery** — Add an `Email` provider to NextAuth or
   integrate Resend/Postmark.
5. **Tests** — Vitest + Testing Library for components, Playwright for
   end-to-end auth + kanban flows.

---

Crafted with care.
