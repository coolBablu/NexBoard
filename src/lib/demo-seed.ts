/**
 * Demo data seeder — populates a fully-loaded collaboration workspace
 * (multiple users, channels with team chat, comments, notifications,
 * a second workspace for the switcher demo, plus all earlier data).
 *
 * Idempotent: only seeds when the database is empty.
 *
 * Used by:
 *   · `npm run seed` (via src/scripts/seed.ts)
 *   · DEMO_MODE auto-seed on first connection (via src/lib/mongodb.ts)
 */

import bcrypt from "bcryptjs";

import { User, defaultPermissionsFor } from "../models/User";
import { Workspace } from "../models/Workspace";
import { Project } from "../models/Project";
import { Task } from "../models/Task";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Activity } from "../models/Activity";
import { Comment } from "../models/Comment";
import { Channel } from "../models/Channel";
import { ChannelMessage } from "../models/ChannelMessage";
import { Notification } from "../models/Notification";

export const DEMO_EMAIL = "demo@novaflow.app";
export const DEMO_PASSWORD = "novaflow123";

let inFlight: Promise<void> | null = null;

/** Seed only when the database has no users yet. Coalesces concurrent calls. */
export async function ensureDemoSeed(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const userCount = await User.estimatedDocumentCount();
    if (userCount > 0) return;
    // eslint-disable-next-line no-console
    console.log("[demo-seed] Empty database detected — seeding demo data…");
    await seedDemoData({ wipe: false });
    // eslint-disable-next-line no-console
    console.log("[demo-seed] Demo data ready. Login with", DEMO_EMAIL);
  })();
  try {
    await inFlight;
  } finally {
    inFlight = null;
  }
}

interface SeedOptions {
  wipe?: boolean;
}

export async function seedDemoData(opts: SeedOptions = {}): Promise<void> {
  const { wipe = false } = opts;

  if (wipe) {
    const existing = await User.findOne({ email: DEMO_EMAIL });
    if (existing) {
      const wss = await Workspace.find({ "members.user": existing._id });
      for (const ws of wss) {
        await Promise.all([
          Project.deleteMany({ workspace: ws._id }),
          Task.deleteMany({ workspace: ws._id }),
          Activity.deleteMany({ workspace: ws._id }),
          Comment.deleteMany({ workspace: ws._id }),
          Channel.deleteMany({ workspace: ws._id }),
          ChannelMessage.deleteMany({ workspace: ws._id }),
          Notification.deleteMany({ workspace: ws._id }),
          Workspace.deleteOne({ _id: ws._id }),
        ]);
      }
      await Conversation.deleteMany({ user: existing._id });
      await Message.deleteMany({ user: existing._id });
      await User.deleteMany({ email: { $regex: "@novaflow.app$", $options: "i" } });
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Users (demo owner + 5 teammates with handles for @mentions)
  // ────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const now = new Date();
  const minutesAgo = (n: number) => new Date(now.getTime() - n * 60_000);

  const memberDefaults = {
    status: "active" as const,
    role: "member" as const,
    permissions: defaultPermissionsFor("member"),
    approvedAt: now,
  };
  const adminDefaults = {
    status: "active" as const,
    role: "admin" as const,
    permissions: defaultPermissionsFor("admin"),
    approvedAt: now,
  };

  const [demoUser, maya, daniel, sara, jordan, aisha] = await User.create([
    {
      name: "Alex Chen",
      email: DEMO_EMAIL,
      handle: "alex",
      passwordHash,
      title: "Head of Product",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nova",
      lastSeenAt: now,
      presenceText: "🚀 shipping",
      role: "super_admin",
      status: "active",
      approvedAt: now,
      permissions: defaultPermissionsFor("super_admin"),
    },
    {
      name: "Maya Okonkwo",
      email: "maya@novaflow.app",
      handle: "maya",
      title: "Design Director",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
      lastSeenAt: minutesAgo(0.5), // online
      presenceText: "🎨 deep work",
      ...adminDefaults,
    },
    {
      name: "Daniel Park",
      email: "daniel@novaflow.app",
      handle: "daniel",
      title: "Engineering Lead",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel",
      lastSeenAt: minutesAgo(1),
      presenceText: null,
      ...adminDefaults,
    },
    {
      name: "Sara Patel",
      email: "sara@novaflow.app",
      handle: "sara",
      title: "Staff PM",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sara",
      lastSeenAt: minutesAgo(4), // away
      presenceText: "📞 customer call",
      ...memberDefaults,
    },
    {
      name: "Jordan Reyes",
      email: "jordan@novaflow.app",
      handle: "jordan",
      title: "VP Engineering",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
      lastSeenAt: minutesAgo(120), // offline
      presenceText: null,
      ...memberDefaults,
    },
    {
      name: "Aisha Khan",
      email: "aisha@novaflow.app",
      handle: "aisha",
      title: "Chief of Staff",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha",
      lastSeenAt: minutesAgo(0.2),
      presenceText: "🌴 OOO Fri",
      ...memberDefaults,
    },
  ]);

  // ────────────────────────────────────────────────────────────────
  // Two workspaces (so the switcher has something to switch to)
  // ────────────────────────────────────────────────────────────────
  const everyone = [
    { user: demoUser._id, role: "owner" as const },
    { user: maya._id, role: "admin" as const },
    { user: daniel._id, role: "admin" as const },
    { user: sara._id, role: "member" as const },
    { user: jordan._id, role: "member" as const },
    { user: aisha._id, role: "member" as const },
  ];

  const workspace = await Workspace.create({
    name: "Acme Inc.",
    slug: `acme-${String(demoUser._id).slice(-6)}`,
    icon: "🏢",
    owner: demoUser._id,
    members: everyone,
  });

  const labWorkspace = await Workspace.create({
    name: "Nova Labs",
    slug: `nova-labs-${String(demoUser._id).slice(-6)}`,
    icon: "🧪",
    owner: demoUser._id,
    members: [
      { user: demoUser._id, role: "owner" as const },
      { user: maya._id, role: "member" as const },
    ],
  });

  demoUser.defaultWorkspace = workspace._id;
  await demoUser.save();

  // ────────────────────────────────────────────────────────────────
  // Projects
  // ────────────────────────────────────────────────────────────────
  const projectSeed = [
    {
      name: "Payments v2",
      description:
        "Redesign the entire billing & payments experience for self-serve customers.",
      progress: 78,
      status: "Active",
      color: "bg-gradient-to-br from-violet-500 to-fuchsia-500",
      icon: "credit-card",
      starred: true,
    },
    {
      name: "AI Assistant",
      description:
        "Ship streaming responses, tool use, and team-context memory for Nova.",
      progress: 54,
      status: "Active",
      color: "bg-gradient-to-br from-cyan-500 to-blue-600",
      icon: "cpu",
      starred: true,
    },
    {
      name: "Onboarding 3.0",
      description:
        "Cinematic, sub-3-minute first-run experience with AI-personalized workspace.",
      progress: 32,
      status: "Planning",
      color: "bg-gradient-to-br from-fuchsia-500 to-rose-500",
      icon: "rocket",
    },
    {
      name: "Design System 4",
      description:
        "Token-driven theming, motion language, and 80+ new components.",
      progress: 92,
      status: "Active",
      color: "bg-gradient-to-br from-amber-400 to-orange-500",
      icon: "palette",
    },
    {
      name: "Insights Engine",
      description:
        "Real-time anomaly detection and AI summaries for every dashboard.",
      progress: 61,
      status: "At risk",
      color: "bg-gradient-to-br from-emerald-400 to-cyan-500",
      icon: "line-chart",
    },
    {
      name: "Trust Center",
      description:
        "SOC 2 Type II, customer-managed keys, and regional data residency.",
      progress: 100,
      status: "Shipped",
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
      icon: "shield",
    },
  ];

  const projects = await Project.insertMany(
    projectSeed.map((p) => ({
      ...p,
      workspace: workspace._id,
      createdBy: demoUser._id,
      members: [demoUser._id, maya._id, daniel._id, sara._id],
    }))
  );

  const projectByName = Object.fromEntries(projects.map((p) => [p.name, p]));

  // ────────────────────────────────────────────────────────────────
  // Tasks (spread across the team via different assignees)
  // ────────────────────────────────────────────────────────────────
  const taskSeed: Array<{
    title: string;
    column: "backlog" | "progress" | "review" | "done";
    priority: "low" | "med" | "high";
    tag: { label: string; color: string };
    project: typeof projects[number]["_id"];
    assignees: Array<typeof demoUser._id>;
    aiAssisted?: boolean;
    commentsCount?: number;
    attachmentsCount?: number;
    done?: boolean;
  }> = [
    {
      title: "Audit empty states across product",
      column: "backlog",
      priority: "med",
      tag: { label: "Design", color: "bg-fuchsia-500/15 text-fuchsia-200" },
      project: projectByName["Design System 4"]._id,
      assignees: [maya._id, demoUser._id],
      commentsCount: 3,
      attachmentsCount: 2,
    },
    {
      title: "Outline pricing experiment",
      column: "backlog",
      priority: "low",
      tag: { label: "Growth", color: "bg-cyan-500/15 text-cyan-200" },
      project: projectByName["Onboarding 3.0"]._id,
      assignees: [sara._id],
      commentsCount: 1,
    },
    {
      title: "Spec audit log export endpoint",
      column: "backlog",
      priority: "med",
      tag: { label: "Backend", color: "bg-violet-500/15 text-violet-200" },
      project: projectByName["Trust Center"]._id,
      assignees: [daniel._id],
      commentsCount: 4,
    },
    {
      title: "Payments redesign · phase 2",
      column: "progress",
      priority: "high",
      tag: { label: "Design", color: "bg-fuchsia-500/15 text-fuchsia-200" },
      project: projectByName["Payments v2"]._id,
      assignees: [maya._id, daniel._id],
      commentsCount: 7,
      attachmentsCount: 5,
    },
    {
      title: "Nova AI: streaming responses",
      column: "progress",
      priority: "high",
      tag: { label: "AI", color: "bg-amber-500/15 text-amber-200" },
      project: projectByName["AI Assistant"]._id,
      assignees: [daniel._id, demoUser._id],
      aiAssisted: true,
      commentsCount: 2,
    },
    {
      title: "Onboarding analytics dashboard",
      column: "progress",
      priority: "med",
      tag: { label: "Data", color: "bg-emerald-500/15 text-emerald-200" },
      project: projectByName["Insights Engine"]._id,
      assignees: [sara._id, aisha._id],
      commentsCount: 5,
      attachmentsCount: 1,
    },
    {
      title: "SSO with Okta + Azure AD",
      column: "review",
      priority: "high",
      tag: { label: "Security", color: "bg-blue-500/15 text-blue-200" },
      project: projectByName["Trust Center"]._id,
      assignees: [daniel._id, jordan._id],
      commentsCount: 4,
    },
    {
      title: "Refactor activity feed query",
      column: "review",
      priority: "low",
      tag: { label: "Backend", color: "bg-violet-500/15 text-violet-200" },
      project: projectByName["AI Assistant"]._id,
      assignees: [daniel._id],
      commentsCount: 2,
    },
    {
      title: "Real-time multiplayer cursors",
      column: "done",
      priority: "high",
      tag: { label: "Platform", color: "bg-fuchsia-500/15 text-fuchsia-200" },
      project: projectByName["Design System 4"]._id,
      assignees: [maya._id, demoUser._id],
      done: true,
      commentsCount: 9,
    },
    {
      title: "Slack 2-way sync",
      column: "done",
      priority: "med",
      tag: { label: "Integrations", color: "bg-cyan-500/15 text-cyan-200" },
      project: projectByName["AI Assistant"]._id,
      assignees: [daniel._id, sara._id],
      done: true,
      commentsCount: 6,
    },
  ];

  const tasks = await Task.insertMany(
    taskSeed.map((t, i) => ({
      ...t,
      workspace: workspace._id,
      createdBy: demoUser._id,
      order: i * 10,
    }))
  );

  const taskByTitle = Object.fromEntries(tasks.map((t) => [t.title, t]));

  // ────────────────────────────────────────────────────────────────
  // Comments on a few tasks (with @mentions)
  // ────────────────────────────────────────────────────────────────
  const paymentsTask = taskByTitle["Payments redesign · phase 2"];
  const streamingTask = taskByTitle["Nova AI: streaming responses"];

  await Comment.insertMany([
    {
      workspace: workspace._id,
      target: { type: "task", id: paymentsTask._id },
      author: maya._id,
      body: "Sketches pushed — @daniel can we sync on the failure copy? The new modal layout breaks our existing toast positioning.",
      mentions: [daniel._id],
      createdAt: minutesAgo(45),
    },
    {
      workspace: workspace._id,
      target: { type: "task", id: paymentsTask._id },
      author: daniel._id,
      body: "Looks great. I'll wire it up tomorrow. @alex worth keeping the legacy modal behind a flag for the rollout week?",
      mentions: [demoUser._id],
      createdAt: minutesAgo(33),
    },
    {
      workspace: workspace._id,
      target: { type: "task", id: paymentsTask._id },
      author: demoUser._id,
      body: "Yes — let's flag it. Sara, please loop in the CS leads before the rollout.",
      mentions: [sara._id],
      createdAt: minutesAgo(20),
    },
    {
      workspace: workspace._id,
      target: { type: "task", id: streamingTask._id },
      author: daniel._id,
      body: "Streaming live in staging. Average TTFT is ~140ms. @alex want me to enable it for the whole team?",
      mentions: [demoUser._id],
      createdAt: minutesAgo(12),
    },
  ]);

  // ────────────────────────────────────────────────────────────────
  // Channels (#general, #design, #engineering)
  // ────────────────────────────────────────────────────────────────
  const [generalCh, designCh, engCh] = await Channel.insertMany([
    {
      workspace: workspace._id,
      type: "channel",
      name: "general",
      topic: "Everyone, every day.",
      icon: "👋",
      isPrivate: false,
      createdBy: demoUser._id,
      lastMessageAt: minutesAgo(2),
      messageCount: 4,
    },
    {
      workspace: workspace._id,
      type: "channel",
      name: "design-reviews",
      topic: "Critique mocks, share Figma links, ship pixels.",
      icon: "🎨",
      isPrivate: false,
      createdBy: maya._id,
      lastMessageAt: minutesAgo(8),
      messageCount: 3,
    },
    {
      workspace: workspace._id,
      type: "channel",
      name: "engineering",
      topic: "Specs, RFCs, prod incidents.",
      icon: "🔧",
      isPrivate: false,
      createdBy: daniel._id,
      lastMessageAt: minutesAgo(25),
      messageCount: 3,
    },
  ]);

  await ChannelMessage.insertMany([
    {
      channel: generalCh._id,
      workspace: workspace._id,
      author: demoUser._id,
      body: "Morning team — Payments v2 launch tomorrow. Final dry-run in 1h. Bring laptops.",
      mentions: [],
      createdAt: minutesAgo(40),
    },
    {
      channel: generalCh._id,
      workspace: workspace._id,
      author: maya._id,
      body: "Mocks are locked. Final review thread in #design-reviews. Feedback by 3pm please 🙏",
      mentions: [],
      createdAt: minutesAgo(28),
    },
    {
      channel: generalCh._id,
      workspace: workspace._id,
      author: aisha._id,
      body: "Reminder: All-hands moved to Thursday 10am. Calendar updated. @alex want me to send a Loom recap for those on PTO?",
      mentions: [demoUser._id],
      createdAt: minutesAgo(15),
    },
    {
      channel: generalCh._id,
      workspace: workspace._id,
      author: daniel._id,
      body: "Streaming AI is live for the whole team in staging. Try @nova in any chat 🚀",
      mentions: [],
      createdAt: minutesAgo(2),
    },
    {
      channel: designCh._id,
      workspace: workspace._id,
      author: maya._id,
      body: "v4 of the payments modal. @alex @sara any concerns with removing the 'remember card' toggle?",
      mentions: [demoUser._id, sara._id],
      createdAt: minutesAgo(60),
    },
    {
      channel: designCh._id,
      workspace: workspace._id,
      author: sara._id,
      body: "From a PM lens — looks great. Cleaner. Let's A/B-test the conversion before we kill it for good.",
      mentions: [],
      createdAt: minutesAgo(45),
    },
    {
      channel: designCh._id,
      workspace: workspace._id,
      author: demoUser._id,
      body: "Agree with Sara — let's ship the new flow behind a flag and watch the metric for a week.",
      mentions: [],
      createdAt: minutesAgo(8),
    },
    {
      channel: engCh._id,
      workspace: workspace._id,
      author: daniel._id,
      body: "Heads up — the activity feed query is N+1 right now. Refactoring this afternoon, should drop p95 from 380ms → 60ms.",
      mentions: [],
      createdAt: minutesAgo(90),
    },
    {
      channel: engCh._id,
      workspace: workspace._id,
      author: jordan._id,
      body: "Nice. Let's also add a Datadog alert for >200ms p95 so this doesn't regress quietly.",
      mentions: [],
      createdAt: minutesAgo(75),
    },
    {
      channel: engCh._id,
      workspace: workspace._id,
      author: daniel._id,
      body: "Done. Refactor PR open: ships behind `feed_v2` flag. Reviewers: @jordan @alex",
      mentions: [jordan._id, demoUser._id],
      createdAt: minutesAgo(25),
    },
  ]);

  // ────────────────────────────────────────────────────────────────
  // Conversation (Nova AI) — kept from earlier seed
  // ────────────────────────────────────────────────────────────────
  const conv = await Conversation.create({
    user: demoUser._id,
    workspace: workspace._id,
    title: "Q4 strategy synthesis",
    preview: "Summarize what shipped this week and surface blockers…",
    messageCount: 2,
    lastMessageAt: minutesAgo(120),
  });
  await Message.insertMany([
    {
      conversation: conv._id,
      user: demoUser._id,
      role: "user",
      content:
        "Summarize what shipped this week and surface anything blocking the Payments v2 launch.",
    },
    {
      conversation: conv._id,
      user: demoUser._id,
      role: "assistant",
      content:
        "This week your team shipped 12 tasks across 3 projects. **Payments v2** is 78% complete, on pace to land 2 days ahead of plan.",
    },
  ]);

  // ────────────────────────────────────────────────────────────────
  // Activities (timeline)
  // ────────────────────────────────────────────────────────────────
  await Activity.insertMany([
    {
      workspace: workspace._id,
      actor: maya._id,
      type: "comment_added",
      text: "commented on 'Payments redesign · phase 2'",
      refType: "task",
      refId: paymentsTask._id,
      createdAt: minutesAgo(45),
    },
    {
      workspace: workspace._id,
      actor: daniel._id,
      type: "task_moved",
      text: "moved 'Nova AI: streaming responses' → in progress",
      refType: "task",
      refId: streamingTask._id,
      createdAt: minutesAgo(30),
    },
    {
      workspace: workspace._id,
      actor: demoUser._id,
      type: "ai_summary",
      text: "summarized 12 docs into a Q4 brief",
      createdAt: minutesAgo(120),
    },
    {
      workspace: workspace._id,
      actor: daniel._id,
      type: "task_completed",
      text: "completed 'Real-time multiplayer cursors'",
      refType: "task",
      createdAt: minutesAgo(60 * 6),
    },
    {
      workspace: workspace._id,
      actor: aisha._id,
      type: "member_joined",
      text: "added Lucas Müller to the workspace",
      createdAt: minutesAgo(60 * 24),
    },
    {
      workspace: workspace._id,
      actor: maya._id,
      type: "project_created",
      text: "created project 'Design System 4'",
      refType: "project",
      refId: projectByName["Design System 4"]._id,
      createdAt: minutesAgo(60 * 24 * 2),
    },
  ]);

  // ────────────────────────────────────────────────────────────────
  // Notifications for the demo user (bell shows real unread)
  // ────────────────────────────────────────────────────────────────
  await Notification.insertMany([
    {
      workspace: workspace._id,
      recipient: demoUser._id,
      actor: maya._id,
      kind: "mention",
      priority: "high",
      title: "Maya mentioned you in #design-reviews",
      body: "v4 of the payments modal. @alex any concerns with removing the 'remember card' toggle?",
      url: `/team?channel=${designCh._id}`,
      entity: { type: "conversation", id: designCh._id },
      createdAt: minutesAgo(60),
    },
    {
      workspace: workspace._id,
      recipient: demoUser._id,
      actor: daniel._id,
      kind: "mention",
      priority: "high",
      title: "Daniel mentioned you on 'Nova AI: streaming responses'",
      body: "Streaming live in staging. Average TTFT is ~140ms.",
      url: `/workspace?task=${streamingTask._id}`,
      entity: { type: "task", id: streamingTask._id },
      createdAt: minutesAgo(12),
    },
    {
      workspace: workspace._id,
      recipient: demoUser._id,
      actor: daniel._id,
      kind: "assigned",
      priority: "normal",
      title: "You were assigned to 'Refactor activity feed query'",
      body: "Drop p95 from 380ms → 60ms.",
      url: "/workspace",
      createdAt: minutesAgo(25),
    },
    {
      workspace: workspace._id,
      recipient: demoUser._id,
      actor: null,
      kind: "ai_insight",
      priority: "normal",
      title: "Nova: 3 stale tasks need a decision",
      body: "Tasks last touched >21 days. Want me to draft a triage doc?",
      url: "/assistant",
      createdAt: minutesAgo(180),
    },
    {
      workspace: workspace._id,
      recipient: demoUser._id,
      actor: jordan._id,
      kind: "due_soon",
      priority: "normal",
      title: "Payments v2 launch is tomorrow",
      body: "Final dry-run in 1h. Bring laptops.",
      url: "/workspace",
      readAt: minutesAgo(30),
      createdAt: minutesAgo(360),
    },
  ]);
}
