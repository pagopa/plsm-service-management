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

type TeamDeleteError = {
  code: "not_found" | "protected" | "validation_error" | "database_error";
  message: string;
};

const teamMembersCountSchema = z.object({
  teamId: z.number().int().positive(),
  membersCount: z.coerce.number().int().nonnegative(),
});

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

export async function readTeamMemberCounts() {
  try {
    const rawCounts = await database
      .from("member_teams")
      .select("teamId")
      .count("id as membersCount")
      .groupBy("teamId");

    const parsedCounts = z.array(teamMembersCountSchema).safeParse(rawCounts);
    if (!parsedCounts.success) {
      console.error(
        "readTeamMemberCounts - validation error",
        parsedCounts.error,
      );
      return { data: null, error: "validation error" };
    }

    const memberCountsByTeamId = parsedCounts.data.reduce<
      Record<number, number>
    >((acc, row) => {
      acc[row.teamId] = row.membersCount;
      return acc;
    }, {});

    return { data: memberCountsByTeamId, error: null };
  } catch (error) {
    console.error("readTeamMemberCounts - database error", error);
    return { data: null, error: "database error" };
  }
}

export async function readTeamById(teamId: number) {
  try {
    const rawTeam = await database
      .from("teams")
      .select("*")
      .where({ id: teamId })
      .first();

    if (!rawTeam) {
      return { data: null, error: "not found" };
    }

    const team = teamSchema.safeParse(rawTeam);
    if (!team.success) {
      console.error("readTeamById - validation error", team.error);
      return { data: null, error: "validation error" };
    }

    return { data: team.data, error: null };
  } catch (error) {
    console.error("readTeamById - database error", error);
    return { data: null, error: "database error" };
  }
}

export async function deleteTeamById(input: {
  teamId: number;
}): Promise<
  { data: { id: number }; error: null } | { data: null; error: TeamDeleteError }
> {
  try {
    const rawTeam = await database
      .from("teams")
      .select({ id: "id", slug: "slug" })
      .where({ id: input.teamId })
      .first();

    if (!rawTeam) {
      return {
        data: null,
        error: { code: "not_found", message: "Team non trovato." },
      };
    }

    const parsedTeam = z
      .object({ id: z.number().int().positive(), slug: z.string().nonempty() })
      .safeParse(rawTeam);

    if (!parsedTeam.success) {
      console.error("deleteTeamById - validation error", parsedTeam.error);
      return {
        data: null,
        error: { code: "validation_error", message: "validation error" },
      };
    }

    if (parsedTeam.data.slug === "admin") {
      return {
        data: null,
        error: {
          code: "protected",
          message: "Il team admin non può essere eliminato.",
        },
      };
    }

    const deletedCount = await database
      .from("teams")
      .where({ id: input.teamId })
      .del();

    if (!deletedCount) {
      return {
        data: null,
        error: { code: "not_found", message: "Team non trovato." },
      };
    }

    return { data: { id: input.teamId }, error: null };
  } catch (error) {
    console.error("deleteTeamById - database error", error);
    return {
      data: null,
      error: { code: "database_error", message: "database error" },
    };
  }
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
