"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { members as membersTable, memberTeams } from "@/db/schema";
import z from "zod";
import { readMemberTeams, teamSchema } from "./teams.service";
import { logServerError } from "@/lib/logger/logger.server.helpers";

const memberSchema = z.object({
  id: z.number(),
  firstname: z.string().nonempty(),
  lastname: z.string().nonempty(),
  email: z.email(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Member = z.infer<typeof memberSchema>;

const memberWithTeamsSchema = memberSchema.extend({
  teams: z.array(teamSchema),
});
export type MemberWithTeams = z.infer<typeof memberWithTeamsSchema>;

type MemberDeleteError = "not found" | "database error";

export async function readMembers() {
  const rawMembers = await getDb().select().from(membersTable);
  const members = z.array(memberSchema).safeParse(rawMembers);
  if (!members.success) {
    logServerError(members.error, "readMembers - validation error");
    return { data: null, error: "validation error" };
  }

  // Fetch teams for each member in parallel
  const membersWithTeams: MemberWithTeams[] = await Promise.all(
    members.data.map(async (member) => {
      const teams = await readMemberTeams(member.id);
      return { ...member, teams: teams.data || [] };
    }),
  );

  return { data: membersWithTeams, error: null };
}

export async function readMemberByEmail(
  email: string,
): Promise<
  { data: MemberWithTeams; error: null } | { data: null; error: string }
> {
  const [rawMember] = await getDb()
    .select()
    .from(membersTable)
    .where(eq(membersTable.email, email))
    .limit(1);

  const member = memberSchema.safeParse(rawMember);
  if (!member.success) {
    logServerError(member.error, "readMemberByEmail - validation error");
    return { data: null, error: "validation error" };
  }

  const teams = await readMemberTeams(member.data.id);
  if (teams.error || teams.data === null) {
    return { data: null, error: teams.error };
  }

  return { data: { ...member.data, teams: teams.data }, error: null };
}

export async function createMember(input: {
  email: string;
  firstname: string;
  lastname: string;
}): Promise<{ data: Member; error: null } | { data: null; error: string }> {
  try {
    const [rawMember] = await getDb()
      .insert(membersTable)
      .values({
        email: input.email,
        firstname: input.firstname,
        lastname: input.lastname,
      })
      .returning();

    const member = memberSchema.safeParse(rawMember);
    if (!member.success) {
      logServerError(member.error, "createMember - validation error");
      return { data: null, error: "validation error" };
    }

    return { data: member.data, error: null };
  } catch (error) {
    logServerError(error, "createMember - database error");
    return { data: null, error: "database error" };
  }
}

export async function deleteMemberById(input: {
  memberId: number;
}): Promise<
  | { data: { id: number }; error: null }
  | { data: null; error: MemberDeleteError }
> {
  try {
    const deletedMemberId = await getDb().transaction(async (trx) => {
      const [existingMember] = await trx
        .select({ id: membersTable.id })
        .from(membersTable)
        .where(eq(membersTable.id, input.memberId))
        .limit(1);

      if (!existingMember) {
        return null;
      }

      await trx
        .delete(memberTeams)
        .where(eq(memberTeams.memberId, input.memberId));
      await trx
        .delete(membersTable)
        .where(eq(membersTable.id, input.memberId));

      return input.memberId;
    });

    if (deletedMemberId === null) {
      return { data: null, error: "not found" };
    }

    return { data: { id: deletedMemberId }, error: null };
  } catch (error) {
    logServerError(error, "deleteMemberById - database error");
    return { data: null, error: "database error" };
  }
}
