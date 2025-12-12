import database from "@/lib/knex";
import { ServiceResult } from "@/lib/types";
import z from "zod";

const tableName = "ama_access";

export const askMeAnythingMemberSchema = z.object({
  id: z.number(),
  firstname: z.string().nonempty(),
  lastname: z.string().nonempty(),
  email: z.email(),
  selfcareAccess: z.boolean().default(false),
  legalAccess: z.boolean().default(false),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type AskMeAnythingMember = z.infer<typeof askMeAnythingMemberSchema>;

export async function readAskMeAnythingMember(
  email: string,
): Promise<ServiceResult<AskMeAnythingMember>> {
  const rawMember = await database
    .from(tableName)
    .select({
      id: "id",
      firstname: "firstname",
      lastname: "lastname",
      email: "email",
      selfcareAccess: "selfcare_access",
      legalAccess: "legal_access",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    })
    .where({ email })
    .first();

  const parsed = askMeAnythingMemberSchema.safeParse(rawMember);

  if (!parsed.success) {
    console.error("readAskMeAnythingMember - member not found", parsed.error);
    return { data: null, error: "member not found" };
  }

  return { data: parsed.data, error: null };
}

export async function readAskMeAnythingMembers(): Promise<
  ServiceResult<AskMeAnythingMember[]>
> {
  try {
    const rawAccess = await database
      .from(tableName)
      .select({
        id: "id",
        firstname: "firstname",
        lastname: "lastname",
        email: "email",
        selfcareAccess: "selfcare_access",
        legalAccess: "legal_access",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
      })
      .orderBy("createdAt", "desc");

    const parsed = z.array(askMeAnythingMemberSchema).safeParse(rawAccess);

    if (!parsed.success) {
      console.error(
        "readAskMeAnythingMembers - validation error",
        parsed.error,
      );
      return { data: null, error: "validation error" };
    }

    return { data: parsed.data, error: null };
  } catch (error) {
    console.error("readAskMeAnythingMembers - database error", error);
    return { data: null, error: "database error" };
  }
}

type MutationError = {
  message?: string;
  fields?: Record<string, string>;
};

export async function createAskMeAnythingMember(input: {
  firstname: string;
  lastname: string;
  email: string;
  selfcareAccess: boolean;
  legalAccess: boolean;
}): Promise<
  | { data: AskMeAnythingMember; error: null }
  | { data: null; error: MutationError }
> {
  try {
    const [rawMember] = await database
      .from(tableName)
      .insert({
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        selfcare_access: input.selfcareAccess,
        legal_access: input.legalAccess,
      })
      .returning("*");

    const parsed = askMeAnythingMemberSchema.safeParse(rawMember);
    if (!parsed.success) {
      console.error(
        "createAskMeAnythingMember - validation error",
        parsed.error,
      );
      return {
        data: null,
        error: {
          message: "validation error",
          //     fields:
          //       (parsed.error.formErrors.fieldErrors as Record<string, string>) ??
          //       undefined,
        },
      };
    }

    return { data: parsed.data, error: null };
  } catch (error) {
    console.error("createAskMeAnythingMember - database error", error);
    return { data: null, error: { message: "database error" } };
  }
}

export async function updateAskMeAnythingMember(input: {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  selfcareAccess: boolean;
  legalAccess: boolean;
}): Promise<
  | { data: AskMeAnythingMember; error: null }
  | { data: null; error: MutationError }
> {
  try {
    const [rawMember] = await database
      .from(tableName)
      .where({ id: input.id })
      .update({
        firstname: input.firstname,
        lastname: input.lastname,
        email: input.email,
        selfcare_access: input.selfcareAccess,
        legal_access: input.legalAccess,
      })
      .returning("*");

    if (!rawMember) {
      return {
        data: null,
        error: { message: "record not found" },
      };
    }

    const parsed = askMeAnythingMemberSchema.safeParse(rawMember);
    if (!parsed.success) {
      console.error(
        "updateAskMeAnythingMember - validation error",
        parsed.error,
      );
      return {
        data: null,
        error: {
          // message: "validation error",
          // fields:
          //   (parsed.error.formErrors.fieldErrors as Record<string, string>) ??
          //   undefined,
        },
      };
    }

    return { data: parsed.data, error: null };
  } catch (error) {
    console.error("updateAskMeAnythingMember - database error", error);
    return { data: null, error: { message: "database error" } };
  }
}
