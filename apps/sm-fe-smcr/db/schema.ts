import { pgTable, uniqueIndex, text, timestamp, foreignKey, unique, index, check, uuid, jsonb, varchar, serial, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const user = pgTable("user", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  email: text().notNull(),
  image: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }),
  updatedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
  uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const member = pgTable("member", {
  id: text().primaryKey().notNull(),
  userId: text().notNull(),
  role: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }),
  teamId: text(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "member_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.teamId],
    foreignColumns: [team.id],
    name: "team_userid_fkey"
  }).onDelete("cascade"),
  unique("member_userid_teamid_unique").on(table.userId, table.teamId),
]);

export const team = pgTable("team", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  image: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }),
  slug: text().notNull(),
}, (table) => [
  unique("team_slug_key").on(table.slug),
]);

export const logs = pgTable("logs", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  timestamp: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
  level: text().notNull(),
  service: text().notNull(),
  message: text().notNull(),
  request: text(),
  context: jsonb(),
}, (table) => [
  index("idx_logs_request").using("btree", table.request.asc().nullsLast().op("text_ops")),
  index("idx_logs_service_level_timestamp_desc").using("btree", table.service.asc().nullsLast().op("text_ops"), table.level.asc().nullsLast().op("text_ops"), table.timestamp.desc().nullsFirst().op("timestamptz_ops")),
  index("idx_logs_timestamp_desc").using("btree", table.timestamp.desc().nullsFirst().op("timestamptz_ops")),
  check("logs_level_check", sql`level = ANY (ARRAY['DEBUG'::text, 'INFO'::text, 'WARN'::text, 'ERROR'::text])`),
  check("logs_service_check", sql`service = ANY (ARRAY['SMCR'::text, 'AMA'::text])`),
]);

export const preferences = pgTable("preferences", {
  id: text().primaryKey().notNull(),
  userId: text("user_id").notNull(),
  teamId: text("team_id"),
  colorMode: varchar("color_mode", { length: 20 }).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "preferences_user_id_fkey"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.teamId],
    foreignColumns: [team.id],
    name: "preferences_team_id_fkey"
  }),
  unique("preferences_user_id_unique").on(table.userId),
  check("valid_color_mode", sql`(color_mode)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'system'::character varying])::text[])`),
]);

export const teams = pgTable("teams", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  slug: text().notNull(),
  icon: text(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  unique("teams_name_key").on(table.name),
  unique("teams_slug_key").on(table.slug),
]);

export const features = pgTable("features", {
  id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "features_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
  name: text().notNull(),
  description: text(),
}, (table) => [
  unique("features_name_key").on(table.name),
]);

export const memberTeams = pgTable("member_teams", {
  id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "member_teams_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
  memberId: integer().notNull(),
  teamId: integer().notNull(),
  createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.memberId],
    foreignColumns: [members.id],
    name: "member_teams_memberId_fkey"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.teamId],
    foreignColumns: [teams.id],
    name: "member_teams_teamId_fkey"
  }).onDelete("cascade"),
  unique("member_teams_unique_pair").on(table.memberId, table.teamId),
]);

export const permissions = pgTable("permissions", {
  id: serial().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  featureId: integer().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.featureId],
    foreignColumns: [features.id],
    name: "permissions_feature_id_fkey"
  }).onDelete("cascade"),
]);

export const teamPermissions = pgTable("team_permissions", {
  id: serial().primaryKey().notNull(),
  teamId: integer().notNull(),
  permissionId: integer().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
  foreignKey({
    columns: [table.teamId],
    foreignColumns: [teams.id],
    name: "team_permissions_teamid_fkey"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.permissionId],
    foreignColumns: [permissions.id],
    name: "team_permissions_permissionid_fkey"
  }).onDelete("cascade"),
  unique("team_permissions_teamid_permissionid_key").on(table.teamId, table.permissionId),
]);

export const members = pgTable("members", {
  id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
  firstname: text().notNull(),
  lastname: text().notNull(),
  email: text().notNull(),
  createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const amaAccess = pgTable("ama_access", {
  id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "ama_access_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
  firstname: text().notNull(),
  lastname: text().notNull(),
  email: text().notNull(),
  selfcareAccess: boolean("selfcare_access").default(false),
  legalAccess: boolean("legal_access").default(false),
  createdAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});
