import database from "@/lib/knex";
import { ServiceResult } from "@/lib/types";
import z from "zod";
import {
  logServerError,
  logServerInfo,
} from "@/lib/logger/logger.server.helpers";

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
    logServerError(parsed.error, "readAskMeAnythingMember - member not found");
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
      logServerError(
        parsed.error,
        "readAskMeAnythingMembers - validation error",
      );
      return { data: null, error: "validation error" };
    }

    return { data: parsed.data, error: null };
  } catch (error) {
    logServerError(error, "readAskMeAnythingMembers - database error");
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
    const alreadyExists = await database
      .from(tableName)
      .select("*")
      .where({ email: input.email })
      .first();

    if (alreadyExists) {
      logServerInfo("createAskMeAnythingMember - member already exists", {
        email: input.email,
      });
      return {
        data: null,
        error: {
          message: "Un utente con questo indirizzo email già esiste.",
        },
      };
    }

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
      logServerError(
        parsed.error,
        "createAskMeAnythingMember - validation error",
      );

      return {
        data: null,
        error: {
          message: "validation error",
          // fields:
          // (parsed.error.formErrors.fieldErrors as Record<string, string>) ??
          // undefined,
        },
      };
    }

    return { data: parsed.data, error: null };
  } catch (error) {
    logServerError(error, "createAskMeAnythingMember - database error");
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
      logServerError(
        parsed.error,
        "updateAskMeAnythingMember - validation error",
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
    logServerError(error, "updateAskMeAnythingMember - database error");
    return { data: null, error: { message: "database error" } };
  }
}

export async function deleteAskMeAnythingMember(input: {
  id: number;
}): Promise<
  { data: { id: number }; error: null } | { data: null; error: MutationError }
> {
  try {
    const deletedCount = await database
      .from(tableName)
      .where({ id: input.id })
      .del();

    if (!deletedCount) {
      return {
        data: null,
        error: { message: "record not found" },
      };
    }

    return { data: { id: input.id }, error: null };
  } catch (error) {
    logServerError(error, "deleteAskMeAnythingMember - database error");
    return { data: null, error: { message: "database error" } };
  }
}
