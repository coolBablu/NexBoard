/**
 * Pure constants + types for Task. NO mongoose / NO server-only imports.
 *
 * Safe to import from BOTH client and server code. The Mongoose model
 * (`@/models/Task`) re-exports these so existing server code keeps
 * working, while client components MUST import from here directly to
 * avoid pulling Mongoose into the browser bundle.
 */

export const TASK_COLUMNS = ["backlog", "progress", "review", "done"] as const;
export type TaskColumn = (typeof TASK_COLUMNS)[number];

export const TASK_PRIORITIES = ["low", "med", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
