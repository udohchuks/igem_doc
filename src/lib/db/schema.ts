import { pgTable, text, timestamp, uuid, jsonb, pgEnum, index, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ─────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("workspace_role", ["owner", "admin", "member", "viewer"]);
export const resourceTypeEnum = pgEnum("resource_type", ["url", "pdf", "doc", "note", "video"]);
export const resourceStatusEnum = pgEnum("resource_status", ["pending", "processing", "ready", "error"]);
export const connectionTypeEnum = pgEnum("connection_type", ["auto", "manual", "cites", "contradicts", "extends"]);

// ─── Workspaces ────────────────────────────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id:        uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name:      text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id:          uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  userId:      uuid("user_id").notNull(), // References auth.users from Supabase
  role:        roleEnum("role").notNull().default("member"),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("workspace_members_user_idx").on(table.userId),
  index("workspace_members_workspace_idx").on(table.workspaceId),
]);

// ─── Resources ─────────────────────────────────────────────────────────────────

export const resources = pgTable("resources", {
  id:             uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId:    uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  addedBy:        uuid("added_by").notNull(), // References auth.users
  type:           resourceTypeEnum("type").notNull(),
  url:            text("url"),
  title:          text("title").notNull(),
  summary:        text("summary"),
  fullText:       text("full_text"),
  tags:           text("tags").array(), // Text array
  status:         resourceStatusEnum("status").notNull().default("pending"),
  datePublished:  timestamp("date_published", { withTimezone: true }),
  metadata:       jsonb("metadata"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("resources_workspace_idx").on(table.workspaceId),
  index("resources_status_idx").on(table.status),
  index("resources_type_idx").on(table.type),
]);

// ─── Embeddings ────────────────────────────────────────────────────────────────
// The actual vector column is handled via raw SQL migrations or Drizzle custom types.
// We'll define a custom type for the vector extension.

import { customType } from "drizzle-orm/pg-core";

const vectorType = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1024)"; // Voyage-4-lite generates 1024 dimensions
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

export const embeddings = pgTable("embeddings", {
  id:         uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: uuid("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }).unique(),
  embedding:  vectorType("embedding"),
});

// ─── Connections ───────────────────────────────────────────────────────────────

export const connections = pgTable("connections", {
  id:        uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId:  uuid("source_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  targetId:  uuid("target_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  type:      connectionTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("connections_source_idx").on(table.sourceId),
  index("connections_target_idx").on(table.targetId),
]);

// ─── Comments ──────────────────────────────────────────────────────────────────

export const comments = pgTable("comments", {
  id:         uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: uuid("resource_id").notNull().references(() => resources.id, { onDelete: "cascade" }),
  userId:     uuid("user_id").notNull(), // References auth.users
  parentId:   uuid("parent_id"), // For threaded comments (self-reference)
  content:    text("content").notNull(),
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("comments_resource_idx").on(table.resourceId),
]);

// ─── Activity Log ──────────────────────────────────────────────────────────────

export const activityLog = pgTable("activity_log", {
  id:         uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
  resourceId: uuid("resource_id").references(() => resources.id, { onDelete: "cascade" }),
  userId:     uuid("user_id").notNull(), // References auth.users
  action:     text("action").notNull(), // e.g., "added_resource", "commented", "changed_status"
  createdAt:  timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("activity_workspace_idx").on(table.workspaceId),
  index("activity_resource_idx").on(table.resourceId),
]);
