"use server";

import {
  createTeam,
  createTeamPermission,
  deleteTeamById,
  readTeamById,
  removeTeamPermission,
  teamSchema,
} from "@/lib/services/teams.service";
import { validateFormData } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import z from "zod";

const createTeamSchema = teamSchema.pick({
  name: true,
  slug: true,
  icon: true,
});
type CreateTeamInput = z.infer<typeof createTeamSchema>;

export type CreateTeamFormState = {
  data: Partial<CreateTeamInput>;
  error: (Partial<CreateTeamInput> & { root?: string }) | null;
};

export async function createTeamAction(
  prevState: CreateTeamFormState,
  formData: FormData,
): Promise<CreateTeamFormState> {
  const { input, errors } = validateFormData(createTeamSchema, formData);
  if (errors) {
    return { data: input, error: errors };
  }

  const result = await createTeam({ ...input, icon: "" });
  if (result.error) {
    console.error(result.error);
    return {
      data: input,
      error: {
        root: "Si è verificato un errore, riprova più tardi.",
      },
    };
  }

  revalidatePath("/dashboard/teams");
  return { data: input, error: null };
}

const updateTeamPermissionSchema = z.object({
  teamId: z.coerce.number().int(),
  permissionId: z.coerce.number().int(),
  active: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
});
type UpdateTeamPermissionInput = z.infer<typeof updateTeamPermissionSchema>;

export type UpdateTeamPermissionFormState = {
  data: Partial<UpdateTeamPermissionInput>;
  error?: { root?: string } | null;
};

export async function updateTeamPermissionAction(
  prevState: UpdateTeamPermissionFormState,
  formData: FormData,
): Promise<UpdateTeamPermissionFormState> {
  const { input, errors } = validateFormData(
    updateTeamPermissionSchema,
    formData,
  );
  if (errors) {
    return { data: input, error: errors };
  }

  console.log(input);
  let result: { error: unknown };

  if (input.active) {
    // handle permission delete
    result = await removeTeamPermission({ ...input });
  } else {
    // handle permission create
    result = await createTeamPermission({ ...input });
  }

  if (result.error) {
    return {
      data: input,
      error: { root: "Si è verificato un errore, riprova più tardi." },
    };
  }

  revalidatePath("/dashboard/teams");

  return { data: { ...input, active: !input.active }, error: null };
}

const deleteTeamSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  confirmationText: z
    .string()
    .trim()
    .min(1, "Inserisci il nome del team per confermare."),
});

type DeleteTeamInput = z.infer<typeof deleteTeamSchema>;

export type DeleteTeamFormState = {
  data: Partial<DeleteTeamInput>;
  error: (Partial<DeleteTeamInput> & { root?: string }) | null;
};

export async function deleteTeamAction(
  prevState: DeleteTeamFormState,
  formData: FormData,
): Promise<DeleteTeamFormState> {
  const { input, errors } = validateFormData(deleteTeamSchema, formData);
  if (errors) {
    return { data: input, error: errors };
  }

  const team = await readTeamById(input.teamId);

  if (team.error || team.data === null) {
    return {
      data: input,
      error: { root: "Team non trovato." },
    };
  }

  if (team.data.slug === "admin") {
    return {
      data: input,
      error: { root: "Il team admin non può essere eliminato." },
    };
  }

  if (input.confirmationText !== team.data.name) {
    return {
      data: input,
      error: {
        confirmationText: `Scrivi esattamente "${team.data.name}" per confermare.`,
      },
    };
  }

  const deletedTeam = await deleteTeamById({ teamId: input.teamId });

  if (deletedTeam.error) {
    const rootErrorMessage =
      deletedTeam.error.message === "database error"
        ? "Si è verificato un errore, riprova più tardi."
        : deletedTeam.error.message;

    return {
      data: input,
      error: {
        root: rootErrorMessage,
      },
    };
  }

  revalidatePath("/dashboard/teams");

  return {
    data: { teamId: input.teamId },
    error: null,
  };
}
