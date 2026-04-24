"use server";

import database from "@/lib/knex";
import z from "zod";
import { readMemberTeams, teamSchema } from "./teams.service";

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
  const rawMembers = await database.from("members").select("*");
  const members = z.array(memberSchema).safeParse(rawMembers);
  if (!members.success) {
    console.error("readMembers - validation error", members.error);
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
  const rawMember = await database
    .from("members")
    .select("*")
    .where({
      email,
    })
    .first();

  const member = memberSchema.safeParse(rawMember);
  if (!member.success) {
    console.error("readMemberByEmail - validation error", member.error);
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
    const [rawMember] = await database
      .from("members")
      .insert({
        email: input.email,
        firstname: input.firstname,
        lastname: input.lastname,
      })
      .returning("*");

    const member = memberSchema.safeParse(rawMember);
    if (!member.success) {
      console.error("createMember - validation error", member.error);
      return { data: null, error: "validation error" };
    }

    return { data: member.data, error: null };
  } catch (error) {
    console.error("createMember - database error", error);
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
    const deletedMemberId = await database.transaction(async (trx) => {
      const existingMember = await trx
        .from("members")
        .select("id")
        .where({ id: input.memberId })
        .first();

      if (!existingMember) {
        return null;
      }

      await trx.from("member_teams").where({ memberId: input.memberId }).del();
      await trx.from("members").where({ id: input.memberId }).del();

      return input.memberId;
    });

    if (deletedMemberId === null) {
      return { data: null, error: "not found" };
    }

    return { data: { id: deletedMemberId }, error: null };
  } catch (error) {
    console.error("deleteMemberById - database error", error);
    return { data: null, error: "database error" };
  }
}
