/**
 * Pure constants + types for Project. NO mongoose / NO server-only imports.
 *
 * Safe to import from BOTH client and server code. The Mongoose model
 * (`@/models/Project`) re-exports these so existing server code keeps
 * working, while client components MUST import from here directly to
 * avoid pulling Mongoose into the browser bundle.
 */

export const PROJECT_STATUSES = [
  "Active",
  "Planning",
  "Shipped",
  "At risk",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_ICONS = [
  "rocket",
  "credit-card",
  "cpu",
  "palette",
  "line-chart",
  "shield",
  "sparkles",
  "folder",
] as const;
export type ProjectIcon = (typeof PROJECT_ICONS)[number];
