"use server";

import { z } from "zod";
import {
  createUser,
  createUserPNPG,
  updateUser,
} from "../services/users.service";
import { revalidateTag } from "next/cache";

const createUserSchema = z.object({
  isPNPG: z
    .string()
    .transform((v) => v === "true")
    .optional(),
  institution: z.string().nonempty(),
  product: z.string().nonempty(),
  firstName: z
    .string()
    .min(2, { message: "First name must be at least 2 characters long" })
    .nonempty({ message: "First name is required" }),
  lastName: z
    .string()
    .min(2, { message: "Last name must be at least 2 characters long" })
    .nonempty({ message: "Last name is required" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .nonempty({ message: "Email is required" }),
  taxCode: z
    .string()
    .regex(/^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i, {
      message: "Invalid Italian tax code format",
    })
    .nonempty({ message: "Tax code is required" }),
  productRole: z
    .string({ message: "Select an item" })
    .nonempty("Select an item"),
  role: z.string({ message: "Select an item" }).nonempty("Select an item"),
  roleLabel: z
    .string({ message: "Role label is required" })
    .nonempty("Role label is required"),
});

type CreateUserInput = z.infer<typeof createUserSchema>;

export type CreateUserFormState = {
  fields: Partial<CreateUserInput>;
  errors?: Partial<CreateUserInput> & { root?: string };
};

export async function createUserAction(
  prevState: CreateUserFormState,
  formData: FormData,
): Promise<CreateUserFormState> {
  const input = Object.fromEntries(formData.entries());
  const validation = createUserSchema.safeParse(input);
  const isPNPG = validation.success && validation.data.isPNPG ? true : false;

  if (!validation.success) {
    const errors: Record<string, string> = {};

    for (const issue of validation.error.issues) {
      if (issue.path.length > 0) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
    }

    return { fields: input, errors };
  }

  const { error } = isPNPG
    ? await createUserPNPG({
        meta: {
          institution: validation.data.institution,
          product: validation.data.product,
        },
        user: {
          ...validation.data,
        },
      })
    : await createUser({
        meta: {
          institution: validation.data.institution,
          product: validation.data.product,
        },
        user: {
          ...validation.data,
        },
      });

  if (error) {
    console.log(error);
    return {
      fields: { ...validation.data },
      errors: {
        root:
          (error as any).detail || "An error occured, please try again later.",
      },
    };
  }

  revalidateTag("users");

  return {
    fields: { ...validation.data },
  };
}

const updateUserSchema = z.object({
  status: z.string().nonempty(),
  userId: z.string().nonempty(),
  institutionId: z.string().nonempty(),
  product: z.string().nonempty(),
});

type UpdateUserInput = z.infer<typeof updateUserSchema>;

export type UpdateUseFormState = {
  fields: Partial<UpdateUserInput>;
  errors?: { root?: string };
};

export async function updateUserAction(
  prevState: UpdateUseFormState,
  formData: FormData,
): Promise<UpdateUseFormState> {
  const input = Object.fromEntries(formData.entries());
  const validation = updateUserSchema.safeParse(input);

  if (!validation.success) {
    const errors: Record<string, string> = {};

    for (const issue of validation.error.issues) {
      if (issue.path.length > 0) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
    }

    return { fields: input, errors };
  }

  const { error } = await updateUser({
    status: validation.data.status,
    product: validation.data.product,
    institution: validation.data.institutionId,
    user: validation.data.userId,
  });

  if (error) {
    return {
      fields: { ...input },
      errors: { root: "An error occurred, please try again later." },
    };
  }

  revalidateTag("users");

  return { fields: { ...input } };
}
