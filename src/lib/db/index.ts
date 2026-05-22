/**
 * Database barrel — one import, everything you need.
 *
 *   import { db } from "@/lib/db";
 *   await db.connect();
 *   const tasks = await db.Task.find({ workspace }).lean();
 *
 * Also re-exports each model + enum + connection helper individually for
 * destructured imports where preferred:
 *
 *   import { dbConnect, Task, TASK_PRIORITIES } from "@/lib/db";
 */

import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { Project } from "@/models/Project";
import { Task } from "@/models/Task";
import { Notification } from "@/models/Notification";
import { Message } from "@/models/Message";
import { Conversation } from "@/models/Conversation";
import { Activity } from "@/models/Activity";
import { AIHistory } from "@/models/AIHistory";
import { PasswordResetToken } from "@/models/PasswordResetToken";
import { Comment } from "@/models/Comment";
import { Channel } from "@/models/Channel";
import { ChannelMessage } from "@/models/ChannelMessage";

export { dbConnect };

// Individual model re-exports (preferred for tree-shaking & jump-to-def).
export { User } from "@/models/User";
export { Workspace } from "@/models/Workspace";
export { Project, PROJECT_STATUSES, PROJECT_ICONS } from "@/models/Project";
export { Task, TASK_COLUMNS, TASK_PRIORITIES } from "@/models/Task";
export {
  Notification,
  NOTIFICATION_KINDS,
  NOTIFICATION_PRIORITIES,
} from "@/models/Notification";
export { Message, MESSAGE_ROLES } from "@/models/Message";
export { Conversation } from "@/models/Conversation";
export { Activity, ACTIVITY_TYPES } from "@/models/Activity";
export {
  AIHistory,
  AI_KINDS,
  AI_PROVIDERS,
  AI_STATUSES,
} from "@/models/AIHistory";
export { PasswordResetToken } from "@/models/PasswordResetToken";
export { Comment } from "@/models/Comment";
export { Channel, CHANNEL_TYPES } from "@/models/Channel";
export { ChannelMessage } from "@/models/ChannelMessage";

// TypeScript document types.
export type { UserDoc } from "@/models/User";
export type { WorkspaceDoc } from "@/models/Workspace";
export type { ProjectDoc, ProjectStatus, ProjectIcon } from "@/models/Project";
export type { TaskDoc, TaskColumn, TaskPriority } from "@/models/Task";
export type {
  NotificationDoc,
  NotificationKind,
  NotificationPriority,
} from "@/models/Notification";
export type { MessageDoc, MessageRole } from "@/models/Message";
export type { ConversationDoc } from "@/models/Conversation";
export type { ActivityDoc, ActivityType } from "@/models/Activity";
export type {
  AIHistoryDoc,
  AIKind,
  AIProvider,
  AIStatus,
} from "@/models/AIHistory";
export type { PasswordResetTokenDoc } from "@/models/PasswordResetToken";
export type { CommentDoc } from "@/models/Comment";
export type { ChannelDoc, ChannelType } from "@/models/Channel";
export type { ChannelMessageDoc } from "@/models/ChannelMessage";

/**
 * Namespaced `db` object for one-import access.
 *
 *   const { Project, Task, connect } = (await import("@/lib/db")).db;
 */
export const db = {
  connect: dbConnect,
  User,
  Workspace,
  Project,
  Task,
  Notification,
  Message,
  Conversation,
  Activity,
  AIHistory,
  PasswordResetToken,
  Comment,
  Channel,
  ChannelMessage,
} as const;

// Re-export reusable query patterns from the sibling module.
export * from "./queries";
