/**
 * Reusable Mongoose query patterns.
 *
 * Each route handler shouldn't have to re-implement pagination, workspace
 * scoping, or membership checks. These helpers give the codebase one
 * canonical place to enforce those rules so security drift is unlikely.
 */

import mongoose, { type FilterQuery, type Query, type Model } from "mongoose";
import { Workspace } from "@/models/Workspace";

// ─────────────────────────────────────────────────────────────────────
// Identifier helpers
// ─────────────────────────────────────────────────────────────────────

export type IdLike = string | mongoose.Types.ObjectId;

/** Safely coerce a string / ObjectId into an ObjectId. Returns null when
 *  the input isn't a valid 24-char hex / ObjectId — useful for guarding
 *  request params before they hit Mongo. */
export function toObjectId(value: unknown): mongoose.Types.ObjectId | null {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === "string" && mongoose.isValidObjectId(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
}

export function isValidObjectId(value: unknown): value is string {
  return typeof value === "string" && mongoose.isValidObjectId(value);
}

// ─────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────

export interface PaginationInput {
  page?: number;
  limit?: number;
  /** Mongoose sort spec (e.g. `{ createdAt: -1 }`). */
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Run a Mongoose model query with consistent pagination metadata.
 *  Caps `limit` to 100 so a misbehaving caller can't request the world. */
export async function paginate<T>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 } as Record<string, 1 | -1>,
  }: PaginationInput = {},
  modifyQuery?: (q: Query<T[], T>) => Query<T[], T>
): Promise<PaginatedResult<T>> {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const skip = (safePage - 1) * safeLimit;

  let q = model
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(safeLimit) as Query<T[], T>;
  if (modifyQuery) q = modifyQuery(q);

  const [data, totalCount] = await Promise.all([
    q.lean<T[]>().exec(),
    model.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / safeLimit));

  return {
    data,
    page: safePage,
    pageSize: safeLimit,
    totalCount,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Workspace scoping & membership
// ─────────────────────────────────────────────────────────────────────

export type WorkspaceRole = "owner" | "admin" | "member" | "guest";

const ROLE_RANK: Record<WorkspaceRole, number> = {
  guest: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

/** Resolves a user's role inside a workspace. `null` if they're not a
 *  member (or the workspace doesn't exist). */
export async function getWorkspaceRole(
  workspaceId: IdLike,
  userId: IdLike
): Promise<WorkspaceRole | null> {
  const wsId = toObjectId(workspaceId);
  const uId = toObjectId(userId);
  if (!wsId || !uId) return null;

  const ws = await Workspace.findOne(
    { _id: wsId, "members.user": uId },
    { "members.$": 1 }
  ).lean();
  if (!ws?.members?.[0]) return null;
  return (ws.members[0].role ?? "member") as WorkspaceRole;
}

/** Boolean shortcut — checks membership and (optionally) a minimum role. */
export async function isWorkspaceMember(
  workspaceId: IdLike,
  userId: IdLike,
  minRole: WorkspaceRole = "guest"
): Promise<boolean> {
  const role = await getWorkspaceRole(workspaceId, userId);
  return role !== null && ROLE_RANK[role] >= ROLE_RANK[minRole];
}

/**
 * Throws a typed error if the user isn't a member of the workspace
 * (or doesn't meet the role requirement). API routes can catch this and
 * map it to a 403 response.
 *
 *   try {
 *     await assertWorkspaceMember(wsId, userId, "admin");
 *   } catch (e) {
 *     if (e instanceof ForbiddenError) return forbidden(e.message);
 *     throw e;
 *   }
 */
export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function assertWorkspaceMember(
  workspaceId: IdLike,
  userId: IdLike,
  minRole: WorkspaceRole = "member"
): Promise<WorkspaceRole> {
  const role = await getWorkspaceRole(workspaceId, userId);
  if (!role) {
    throw new ForbiddenError("Not a member of this workspace");
  }
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`Requires role: ${minRole} or higher`);
  }
  return role;
}

/** Wraps a filter with a `workspace` scope. Use it to guarantee no
 *  collection-level query escapes its workspace by accident:
 *
 *    Task.find(scopedToWorkspace(wsId, { done: false }))
 */
export function scopedToWorkspace<T extends Record<string, unknown>>(
  workspaceId: IdLike,
  filter: T = {} as T
): T & { workspace: mongoose.Types.ObjectId } {
  const wsId = toObjectId(workspaceId);
  if (!wsId) {
    throw new Error("scopedToWorkspace: invalid workspace id");
  }
  return { ...filter, workspace: wsId };
}

// ─────────────────────────────────────────────────────────────────────
// Serialization
// ─────────────────────────────────────────────────────────────────────

type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | mongoose.Types.ObjectId
  | Serializable[]
  | { [k: string]: Serializable };

/**
 * Recursively converts a lean Mongoose doc into a JSON-safe object:
 *  · `_id` → `id` (string)
 *  · ObjectIds → strings
 *  · Dates → ISO strings
 *  · `__v` removed
 *
 * Use before returning data to the client so route handlers don't have to
 * sprinkle `String(doc._id)` everywhere.
 */
export function toJSON<T>(doc: T): unknown {
  if (doc == null) return doc;
  if (Array.isArray(doc)) return doc.map((d) => toJSON(d));
  if (doc instanceof mongoose.Types.ObjectId) return doc.toString();
  if (doc instanceof Date) return doc.toISOString();
  if (typeof doc === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(doc as Record<string, Serializable>)) {
      if (k === "__v") continue;
      if (k === "_id") {
        out.id = toJSON(v as Serializable);
        continue;
      }
      out[k] = toJSON(v as Serializable);
    }
    return out;
  }
  return doc;
}

// ─────────────────────────────────────────────────────────────────────
// Atomic counters (e.g. comment counts on a task)
// ─────────────────────────────────────────────────────────────────────

/** Atomically increment a numeric field. Returns the post-update value. */
export async function incrementField<T>(
  model: Model<T>,
  id: IdLike,
  field: string,
  by = 1
): Promise<number | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const updated = await model
    .findOneAndUpdate(
      { _id } as FilterQuery<T>,
      { $inc: { [field]: by } as Record<string, number> },
      { new: true, projection: { [field]: 1 } }
    )
    .lean<Record<string, number>>();
  return updated ? (updated[field] ?? null) : null;
}
