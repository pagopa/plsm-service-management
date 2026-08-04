import { and, asc, eq, sql } from "drizzle-orm";
import z from "zod";
import { db } from "@/db";
import {
  memberTeams,
  members,
  permissions,
  teamPermissions,
  teams,
} from "@/db/schema";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

export const teamSchema = z.object({
  createdByMemberId: z.number().int().positive().nullable(),
  department: z.string().nullable(),
  description: z.string().nullable(),
  id: z.number().int().positive(),
  name: z.string().nonempty(),
  slug: z.string().nonempty(),
  status: z.enum(["active", "draft", "suspended"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Team = z.infer<typeof teamSchema>;

export const permissionSchema = z.object({
  id: z.number().int().positive(),
  code: z.string().nonempty(),
  name: z.string().nonempty(),
  description: z.string().nullable(),
  status: z.enum(["active", "archived"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Permission = z.infer<typeof permissionSchema>;

export const teamPermissionSchema = z.object({
  teamId: z.number().int().positive(),
  permissionId: z.number().int().positive(),
  createdAt: z.date(),
});
export type TeamPermission = z.infer<typeof teamPermissionSchema>;

export type TeamWithPermissions = Team & {
  permissions: Array<number>;
};

const teamListItemSchema = teamSchema
  .pick({
    id: true,
    name: true,
    slug: true,
    status: true,
  })
  .extend({
    memberCount: z.number().int().nonnegative(),
  });
export type TeamListItem = z.infer<typeof teamListItemSchema>;

const teamDetailMemberSchema = z.object({
  email: z.email(),
  firstname: z.string().nonempty(),
  id: z.number().int().positive(),
  lastname: z.string().nonempty(),
  status: z.enum(["active", "suspended"]),
});
export type TeamDetailMember = z.infer<typeof teamDetailMemberSchema>;

const teamDetailPermissionSchema = permissionSchema.pick({
  code: true,
  description: true,
  id: true,
  name: true,
  status: true,
});
export type TeamDetailPermission = z.infer<
  typeof teamDetailPermissionSchema
>;

const teamCreatorSchema = teamDetailMemberSchema.pick({
  email: true,
  firstname: true,
  id: true,
  lastname: true,
});
export type TeamCreator = z.infer<typeof teamCreatorSchema>;

const teamDetailSchema = teamSchema.extend({
  createdBy: teamCreatorSchema.nullable(),
  members: z.array(teamDetailMemberSchema),
  permissions: z.array(teamDetailPermissionSchema),
});
export type TeamDetail = z.infer<typeof teamDetailSchema>;

const submitTeamAccessRequestSchema = z.object({
  team: z
    .string()
    .min(1, "Seleziona un team")
    .refine((value) => value === "other" || /^\d+$/.test(value), {
      message: "Team non valido",
    }),
  reason: z
    .string()
    .trim()
    .min(3, "Inserisci almeno 3 caratteri")
    .max(256, "Inserisci massimo 256 caratteri"),
});

type SubmitTeamAccessRequestInput = z.infer<
  typeof submitTeamAccessRequestSchema
>;

type SubmitTeamAccessRequestError = {
  team?: string;
  reason?: string;
};

type SubmitTeamAccessRequestResponse =
  | {
      data: SubmitTeamAccessRequestInput;
      error: null;
      fields: null;
    }
  | {
      data: null;
      error: "validation error" | "internal error";
      fields: SubmitTeamAccessRequestError | null;
    };

export async function submitTeamAccessRequest(
  input: SubmitTeamAccessRequestInput,
): Promise<SubmitTeamAccessRequestResponse> {
  const validation = submitTeamAccessRequestSchema.safeParse(input);
  if (!validation.success) {
    const flatErrors = validation.error.flatten().fieldErrors;
    const fields: SubmitTeamAccessRequestError = {};

    if (flatErrors.team?.[0]) {
      fields.team = flatErrors.team[0];
    }

    if (flatErrors.reason?.[0]) {
      fields.reason = flatErrors.reason[0];
    }

    logServerError(validation.error, "submitTeamAccessRequest - validation error");

    return { data: null, error: "validation error", fields };
  }

  try {
    logServerInfo("submitTeamAccessRequest - payload", validation.data);
    return { data: validation.data, error: null, fields: null };
  } catch (error) {
    logServerError(error, "submitTeamAccessRequest - internal error");
    return { data: null, error: "internal error", fields: null };
  }
}

export async function readTeams() {
  try {
    const [rawTeams, rawTeamPermissions] = await Promise.all([
      db.select().from(teams),
      db
        .select({
          createdAt: teamPermissions.createdAt,
          permissionId: teamPermissions.permissionId,
          teamId: teamPermissions.teamId,
        })
        .from(teamPermissions),
    ]);

    const parsedTeams = z.array(teamSchema).safeParse(rawTeams);
    const parsedTeamPermissions = z
      .array(teamPermissionSchema)
      .safeParse(rawTeamPermissions);

    if (!parsedTeams.success || !parsedTeamPermissions.success) {
      logServerError(
        parsedTeams.success ? parsedTeamPermissions.error : parsedTeams.error,
        "readTeams - validation error",
      );
      return { data: null, error: "validation error" };
    }

    const result: Array<TeamWithPermissions> = parsedTeams.data.map((team) => ({
      ...team,
      permissions: parsedTeamPermissions.data
        .filter((assignment) => assignment.teamId === team.id)
        .map((assignment) => assignment.permissionId),
    }));

    return { data: result, error: null };
  } catch (error) {
    logServerError(error, "readTeams - database error");
    return { data: null, error: "database error" };
  }
}

export async function readTeamsList() {
  try {
    const rawTeams = await db
      .select({
        id: teams.id,
        memberCount: sql<number>`count(${memberTeams.memberId})::int`,
        name: teams.name,
        slug: teams.slug,
        status: teams.status,
      })
      .from(teams)
      .leftJoin(memberTeams, eq(teams.id, memberTeams.teamId))
      .groupBy(teams.id, teams.name, teams.slug, teams.status)
      .orderBy(asc(teams.name));
    const parsedTeams = z.array(teamListItemSchema).safeParse(rawTeams);

    if (!parsedTeams.success) {
      logServerError(parsedTeams.error, "readTeamsList - validation error");
      return { data: null, error: "validation error" };
    }

    return { data: parsedTeams.data, error: null };
  } catch (error) {
    logServerError(error, "readTeamsList - database error");
    return { data: null, error: "database error" };
  }
}

export async function readTeamDetail(teamId: number) {
  try {
    const [rawTeam] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!rawTeam) {
      return { data: null, error: "not found" };
    }

    const [rawMembers, rawPermissions, rawCreatorRows] = await Promise.all([
      db
        .select({
          email: members.email,
          firstname: members.firstname,
          id: members.id,
          lastname: members.lastname,
          status: members.status,
        })
        .from(memberTeams)
        .innerJoin(members, eq(memberTeams.memberId, members.id))
        .where(eq(memberTeams.teamId, teamId))
        .orderBy(asc(members.lastname), asc(members.firstname)),
      db
        .select({
          code: permissions.code,
          description: permissions.description,
          id: permissions.id,
          name: permissions.name,
          status: permissions.status,
        })
        .from(teamPermissions)
        .innerJoin(
          permissions,
          eq(teamPermissions.permissionId, permissions.id),
        )
        .where(eq(teamPermissions.teamId, teamId))
        .orderBy(asc(permissions.code)),
      rawTeam.createdByMemberId
        ? db
            .select({
              email: members.email,
              firstname: members.firstname,
              id: members.id,
              lastname: members.lastname,
            })
            .from(members)
            .where(eq(members.id, rawTeam.createdByMemberId))
            .limit(1)
        : Promise.resolve([]),
    ]);

    const parsedTeam = teamDetailSchema.safeParse({
      ...rawTeam,
      createdBy: rawCreatorRows[0] ?? null,
      members: rawMembers,
      permissions: rawPermissions,
    });

    if (!parsedTeam.success) {
      logServerError(parsedTeam.error, "readTeamDetail - validation error");
      return { data: null, error: "validation error" };
    }

    return { data: parsedTeam.data, error: null };
  } catch (error) {
    logServerError(error, "readTeamDetail - database error");
    return { data: null, error: "database error" };
  }
}

export async function readPermissions() {
  try {
    const rawPermissions = await db.select().from(permissions);
    const parsedPermissions = z
      .array(permissionSchema)
      .safeParse(rawPermissions);

    if (!parsedPermissions.success) {
      logServerError(parsedPermissions.error, "readPermissions - validation error");
      return { data: null, error: "validation error" };
    }

    return { data: parsedPermissions.data, error: null };
  } catch (error) {
    logServerError(error, "readPermissions - database error");
    return { data: null, error: "database error" };
  }
}

export async function readMemberTeams(memberId: number) {
  try {
    const rawTeams = await db
      .select({
        createdAt: teams.createdAt,
        createdByMemberId: teams.createdByMemberId,
        department: teams.department,
        description: teams.description,
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
        status: teams.status,
        updatedAt: teams.updatedAt,
      })
      .from(memberTeams)
      .innerJoin(teams, eq(memberTeams.teamId, teams.id))
      .where(eq(memberTeams.memberId, memberId));
    const parsedTeams = z.array(teamSchema).safeParse(rawTeams);

    if (!parsedTeams.success) {
      logServerError(parsedTeams.error, "readMemberTeams - validation error");
      return { data: null, error: "validation error" };
    }

    return { data: parsedTeams.data, error: null };
  } catch (error) {
    logServerError(error, "readMemberTeams - database error");
    return { data: null, error: "database error" };
  }
}

export async function createMemberTeam(input: {
  memberId: number;
  teamId: number;
}) {
  try {
    await db
      .insert(memberTeams)
      .values(input)
      .onConflictDoNothing({
        target: [memberTeams.memberId, memberTeams.teamId],
      });

    return { error: null };
  } catch (error) {
    logServerError(error, "createMemberTeam - database error");
    return { error };
  }
}

export async function removeMemberTeam(input: {
  memberId: number;
  teamId: number;
}) {
  try {
    await db
      .delete(memberTeams)
      .where(
        and(
          eq(memberTeams.memberId, input.memberId),
          eq(memberTeams.teamId, input.teamId),
        ),
      );

    return { error: null };
  } catch (error) {
    logServerError(error, "removeMemberTeam - database error");
    return { error };
  }
}
