import {
  pgSchema,
  pgEnum,
  pgTable,
  integer,
  text,
  uuid,
  serial,
  timestamp,
  boolean,
  jsonb,
  index,
  primaryKey,
  unique,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const test = pgSchema("test");

export const memberStatus = pgEnum("member_status", ["active", "suspended"]);
export const permissionStatus = pgEnum("permission_status", [
  "active",
  "archived",
]);
export const teamStatus = pgEnum("team_status", [
  "active",
  "inactive",
]);

export const amaAccess = pgTable("ama_access", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  firstname: text().notNull(),
  lastname: text().notNull(),
  email: text().notNull(),
  selfcareAccess: boolean("selfcare_access").default(false),
  legalAccess: boolean("legal_access").default(false),
  createdAt: timestamp({ withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp({ withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const logs = pgTable(
  "logs",
  {
    id: uuid().defaultRandom().primaryKey(),
    timestamp: timestamp({ withTimezone: true }).notNull(),
    level: text().notNull(),
    service: text().notNull(),
    message: text().notNull(),
    request: text(),
    context: jsonb(),
  },
  (table) => [
    index("idx_logs_request").using("btree", table.request.asc().nullsLast()),
    index("idx_logs_service_level_timestamp_desc").using(
      "btree",
      table.service.asc().nullsLast(),
      table.level.asc().nullsLast(),
      table.timestamp.desc().nullsFirst(),
    ),
    index("idx_logs_timestamp_desc").using(
      "btree",
      table.timestamp.desc().nullsFirst(),
    ),
    check(
      "logs_level_check",
      sql`(level = ANY (ARRAY['DEBUG'::text, 'INFO'::text, 'WARN'::text, 'ERROR'::text]))`,
    ),
    check(
      "logs_service_check",
      sql`(service = ANY (ARRAY['SMCR'::text, 'AMA'::text]))`,
    ),
  ],
);

export const memberTeams = pgTable(
  "member_teams",
  {
    memberId: integer()
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.memberId, table.teamId],
      name: "member_teams_pkey",
    }),
  ],
);

export const members = pgTable(
  "members",
  {
    id: integer()
      .primaryKey()
      .generatedAlwaysAsIdentity({ name: "users_id_seq" }),
    authSubject: text(),
    firstname: text().notNull(),
    lastname: text().notNull(),
    email: text().notNull(),
    status: memberStatus().default("active").notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    unique("members_auth_subject_key").on(table.authSubject),
    unique("members_email_key").on(table.email),
  ],
);

export const permissions = pgTable(
  "permissions",
  {
    id: serial().primaryKey(),
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    status: permissionStatus().default("active").notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [unique("permissions_code_key").on(table.code)],
);

export const teamPermissions = pgTable(
  "team_permissions",
  {
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    permissionId: integer()
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.teamId, table.permissionId],
      name: "team_permissions_pkey",
    }),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: serial().primaryKey(),
    name: text().notNull(),
    slug: text().notNull(),
    description: text(),
    department: text(),
    createdByMemberId: integer().references(() => members.id, {
      onDelete: "set null",
    }),
    status: teamStatus().default("inactive").notNull(),
    createdAt: timestamp()
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp()
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    unique("teams_name_key").on(table.name),
    unique("teams_slug_key").on(table.slug),
  ],
);
