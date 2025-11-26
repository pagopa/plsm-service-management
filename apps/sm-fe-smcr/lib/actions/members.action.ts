"use server";

import {
  createMemberTeam,
  removeMemberTeam,
} from "@/lib/services/teams.service";
import { validateFormData } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import z from "zod";

const updateMemberTeamSchema = z.object({
  memberId: z.coerce.number().int(),
  teamId: z.coerce.number().int(),
  active: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
});
type UpdateMemberTeamInput = z.infer<typeof updateMemberTeamSchema>;

export type UpdateMemberTeamFormState = {
  data: Partial<UpdateMemberTeamInput>;
  error?: { root?: string } | null;
};

export async function updateMemberTeamAction(
  prevState: UpdateMemberTeamFormState,
  formData: FormData,
): Promise<UpdateMemberTeamFormState> {
  const { input, errors } = validateFormData(updateMemberTeamSchema, formData);
  if (errors) {
    return { data: input, error: errors };
  }

  console.log(input);
  let result: { error: unknown };

  if (input.active) {
    // handle member-team delete (remove member from team)
    result = await removeMemberTeam({ ...input });
  } else {
    // handle member-team create (add member to team)
    result = await createMemberTeam({ ...input });
  }

  if (result.error) {
    return {
      data: input,
      error: { root: "Si è verificato un errore, riprova più tardi." },
    };
  }

  revalidatePath("/dashboard/members");

  return { data: { ...input, active: !input.active }, error: null };
}
