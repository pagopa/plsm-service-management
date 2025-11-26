import database from "@/lib/knex";
import z from "zod";

export const teamSchema = z.object({
  id: z.number(),
  name: z.string().nonempty(),
  slug: z.string().nonempty(),
  icon: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Team = z.infer<typeof teamSchema>;

export const featureSchema = z.object({
  id: z.number(),
  name: z.string().nonempty(),
  description: z.string().optional().nullable(),
});
export type Feature = z.infer<typeof featureSchema>;

export const permissionSchema = z.object({
  id: z.number(),
  name: z.string().nonempty(),
  description: z.string().optional().nullable(),
  featureId: z.number().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Permission = z.infer<typeof permissionSchema>;

export const teamPermissionSchema = z.object({
  id: z.number().int().positive(),
  teamId: z.number().int().positive(),
  permissionId: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type TeamPermission = z.infer<typeof teamPermissionSchema>;

export type TeamWithPermissions = Team & {
  permissions: Array<number>;
};

export type FeatureWithPermissions = Feature & {
  permissions: Array<Permission>;
};

export async function readTeams() {
  const rawTeams = await database.from("teams").select("*");
  const teams = z.array(teamSchema).safeParse(rawTeams);
  if (!teams.success) {
    console.error("readTeams - validation error", teams.error);
    return { data: null, error: "validation error" };
  }

  const rawTeamPermissions = await database
    .from("team_permissions")
    .select("*");
  const teamPermissions = z
    .array(teamPermissionSchema)
    .safeParse(rawTeamPermissions);
  if (!teamPermissions.success) {
    console.error(
      "readPermissions - team permissions validation error",
      teamPermissions.error,
    );
    return { data: null, error: "validation error" };
  }

  const teamsWithPermissions: Array<TeamWithPermissions> = teams.data.map(
    (team) => ({
      ...team,
      permissions: teamPermissions.data
        .filter((permission) => permission.teamId === team.id)
        .map((permission) => permission.permissionId),
    }),
  );

  return { data: teamsWithPermissions, error: null };
}

export async function createTeam(input: {
  name: string;
  slug: string;
  icon?: string;
}) {
  const result = await database.table("teams").insert(input, "*");

  const validation = z.array(teamSchema).safeParse(result);
  if (!validation.success) {
    console.error("createTeam - validation error", validation.error);
    return { data: null, error: "validation error" };
  }

  return { data: validation.data, error: null };
}

export async function readPermissions() {
  const rawFeatures = await database.from("features").select("*");
  const features = z.array(featureSchema).safeParse(rawFeatures);
  if (!features.success) {
    console.error(
      "readPermissions - features validation error",
      features.error,
    );
    return { data: null, error: "validation error" };
  }

  const rawPermissions = await database.from("permissions").select("*");
  const permissions = z.array(permissionSchema).safeParse(rawPermissions);
  if (!permissions.success) {
    console.error(
      "readPermissions - permissions validation error",
      permissions.error,
    );
    return { data: null, error: "validation error" };
  }

  const featuresWithPermissions = features.data.map((feature) => ({
    ...feature,
    permissions: permissions.data.filter(
      (permission) => permission.featureId === feature.id,
    ),
  }));

  return { data: featuresWithPermissions, error: null };
}

export async function createTeamPermission(input: {
  teamId: number;
  permissionId: number;
}) {
  try {
    await database
      .table("team_permissions")
      .insert({
        teamId: input.teamId,
        permissionId: input.permissionId,
      })
      .returning("*");

    return { error: null };
  } catch (error) {
    console.error(error);
    return { error };
  }
}

export async function removeTeamPermission(input: {
  teamId: number;
  permissionId: number;
}) {
  try {
    await database
      .table("team_permissions")
      .delete("*")
      .where({ teamId: input.teamId, permissionId: input.permissionId });

    return { error: null };
  } catch (error) {
    console.error(error);
    return { error };
  }
}

export async function readMemberTeams(memberId: number) {
  const rawTeams = await database
    .from("member_teams")
    .join("teams", "member_teams.teamId", "teams.id")
    .select("teams.*")
    .where({ memberId: memberId });
  const teams = z.array(teamSchema).safeParse(rawTeams);
  if (!teams.success) {
    console.error("readTeams - validation error", teams.error);
    return { data: null, error: "validation error" };
  }

  return { data: teams.data, error: null };
}

export async function createMemberTeam(input: {
  memberId: number;
  teamId: number;
}) {
  try {
    await database
      .table("member_teams")
      .insert({
        memberId: input.memberId,
        teamId: input.teamId,
      })
      .returning("*");

    return { error: null };
  } catch (error) {
    console.error(error);
    return { error };
  }
}

export async function removeMemberTeam(input: {
  memberId: number;
  teamId: number;
}) {
  try {
    await database
      .table("member_teams")
      .delete("*")
      .where({ memberId: input.memberId, teamId: input.teamId });

    return { error: null };
  } catch (error) {
    console.error(error);
    return { error };
  }
}
