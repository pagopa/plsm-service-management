"use server";

import {
  createTeam,
  createTeamPermission,
  deleteTeamById,
  readTeamById,
  removeTeamPermission,
  teamSchema,
  updateTeamById,
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

const updateTeamSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  name: z
    .string()
    .trim()
    .min(1, "Il nome del team è obbligatorio.")
    .max(120, "Il nome del team può contenere massimo 120 caratteri."),
  slug: z.string().trim().min(1),
  icon: z.string().trim(),
});

type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export type UpdateTeamFormState = {
  data: Partial<UpdateTeamInput>;
  error: (Partial<UpdateTeamInput> & { root?: string }) | null;
};

export async function updateTeamAction(
  prevState: UpdateTeamFormState,
  formData: FormData,
): Promise<UpdateTeamFormState> {
  const { input, errors } = validateFormData(updateTeamSchema, formData);
  if (errors) {
    return { data: input, error: errors };
  }

  const existingTeam = await readTeamById(input.teamId);

  if (existingTeam.error || existingTeam.data === null) {
    return {
      data: input,
      error: { root: "Team non trovato." },
    };
  }

  if (input.slug !== existingTeam.data.slug) {
    return {
      data: input,
      error: { slug: "Lo slug non può essere modificato." },
    };
  }

  const updatedTeam = await updateTeamById({
    teamId: input.teamId,
    name: input.name,
    icon: input.icon,
  });

  if (updatedTeam.error) {
    if (updatedTeam.error.code === "conflict" && updatedTeam.error.field) {
      return {
        data: input,
        error: {
          [updatedTeam.error.field]: updatedTeam.error.message,
        },
      };
    }

    return {
      data: input,
      error: {
        root:
          updatedTeam.error.message === "database error"
            ? "Si è verificato un errore, riprova più tardi."
            : updatedTeam.error.message,
      },
    };
  }

  revalidatePath("/dashboard/teams");

  return {
    data: {
      teamId: updatedTeam.data.id,
      name: updatedTeam.data.name,
      slug: updatedTeam.data.slug,
      icon: updatedTeam.data.icon ?? "",
    },
    error: null,
  };
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
