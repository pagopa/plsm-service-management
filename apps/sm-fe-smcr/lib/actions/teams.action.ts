"use server";

import { submitTeamAccessRequest } from "@/lib/services/teams.service";

export async function submitTeamAccessRequestAction(input: {
  team: string;
  reason: string;
}) {
  return submitTeamAccessRequest(input);
}
