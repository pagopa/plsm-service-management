import { relations } from "drizzle-orm/relations";
import { user, member, team, preferences, members, memberTeams, teams, features, permissions, teamPermissions } from "./schema";

export const memberRelations = relations(member, ({ one }) => ({
  user_userId: one(user, {
    fields: [member.userId],
    references: [user.id],
    relationName: "member_userId_user_id"
  }),
  team: one(team, {
    fields: [member.teamId],
    references: [team.id]
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  members_userId: many(member, {
    relationName: "member_userId_user_id"
  }),
  preferences: many(preferences),
}));

export const teamRelations = relations(team, ({ many }) => ({
  members: many(member),
  preferences: many(preferences),
}));

export const preferencesRelations = relations(preferences, ({ one }) => ({
  user: one(user, {
    fields: [preferences.userId],
    references: [user.id]
  }),
  team: one(team, {
    fields: [preferences.teamId],
    references: [team.id]
  }),
}));

export const memberTeamsRelations = relations(memberTeams, ({ one }) => ({
  member: one(members, {
    fields: [memberTeams.memberId],
    references: [members.id]
  }),
  team: one(teams, {
    fields: [memberTeams.teamId],
    references: [teams.id]
  }),
}));

export const membersRelations = relations(members, ({ many }) => ({
  memberTeams: many(memberTeams),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  memberTeams: many(memberTeams),
  teamPermissions: many(teamPermissions),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  feature: one(features, {
    fields: [permissions.featureId],
    references: [features.id]
  }),
  teamPermissions: many(teamPermissions),
}));

export const featuresRelations = relations(features, ({ many }) => ({
  permissions: many(permissions),
}));

export const teamPermissionsRelations = relations(teamPermissions, ({ one }) => ({
  team: one(teams, {
    fields: [teamPermissions.teamId],
    references: [teams.id]
  }),
  permission: one(permissions, {
    fields: [teamPermissions.permissionId],
    references: [permissions.id]
  }),
}));

