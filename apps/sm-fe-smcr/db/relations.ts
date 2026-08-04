import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  members: {
    teams: r.many.teams({
      from: r.members.id.through(r.memberTeams.memberId),
      to: r.teams.id.through(r.memberTeams.teamId),
    }),
  },
  teams: {
    members: r.many.members(),
    permissions: r.many.permissions(),
  },
  permissions: {
    feature: r.one.features({
      from: r.permissions.featureId,
      to: r.features.id,
    }),
    teams: r.many.teams({
      from: r.permissions.id.through(r.teamPermissions.permissionId),
      to: r.teams.id.through(r.teamPermissions.teamId),
    }),
  },
  features: {
    permissions: r.many.permissions(),
  },
}));
