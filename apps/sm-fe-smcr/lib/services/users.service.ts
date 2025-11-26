"use server";

import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().optional(),
  surname: z.string().optional(),
  email: z.string().email().optional(),
  lastActiveOnboardingUserEmail: z.string().email().optional(),
  roles: z
    .array(
      z.enum([
        "admin",
        "operator",
        "api",
        "security",
        "admin-psp",
        "operator-psp",
        "ORG_ADMIN",
        "pagopa_admin",
        "ope_base",
      ]),
    )
    .optional(),
  role: z
    .enum(["SUB_DELEGATE", "DELEGATE", "OPERATOR", "MANAGER", "ADMIN_EA"])
    .optional(),
});
export type User = z.infer<typeof UserSchema>;

export async function getUsersByInstitutionId(
  institutionId: string,
  product: string,
) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/internal/v1/institutions/${institutionId}/users?productId=${product}`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY as string,
      },
      output: z.array(UserSchema),
      next: {
        tags: ["users"],
      },
    },
  );

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function getUsersPNPGByInstitutionId(institutionId: string) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/pn-pg/support/v1/institutions/${institutionId}/users`,
    {
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.FE_SMCR_API_KEY_PNPG as string,
      },
      output: z.array(UserSchema),
      next: {
        tags: ["users"],
      },
    },
  );

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function createUser(input: {
  meta: { institution: string; product: string };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    taxCode: string;
    productRole: string;
    role: string;
    roleLabel: string;
  };
}) {
  const { data, error } = await betterFetch(
    "https://api.selfcare.pagopa.it/external/support/v1/onboarding/users",
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        institutionId: input.meta.institution,
        productId: input.meta.product,
        sendCreateUserNotificationEmail: false,
        users: [
          {
            taxCode: input.user.taxCode,
            name: input.user.firstName,
            surname: input.user.lastName,
            email: input.user.email,
            productRole: input.user.productRole,
            role: input.user.role,
            roleLabel: input.user.roleLabel,
          },
        ],
      }),
    },
  );

  return { data, error };
}

export async function createUserPNPG(input: {
  meta: { institution: string; product: string };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    taxCode: string;
    productRole: string;
    role: string;
    roleLabel: string;
  };
}) {
  const { data, error } = await betterFetch(
    "https://api.selfcare.pagopa.it/external/pn-pg/support/v1/onboarding/users",
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.FE_SMCR_API_KEY_PNPG as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        institutionId: input.meta.institution,
        productId: input.meta.product,
        users: [
          {
            taxCode: input.user.taxCode,
            name: input.user.firstName,
            surname: input.user.lastName,
            email: input.user.email,
            productRole: input.user.productRole,
            role: input.user.role,
          },
        ],
        sendCreateUserNotificationEmail: false,
      }),
    },
  );
  console.log({ error });

  return { data, error };
}

const readUserOutput = z.object({
  id: z.string(),
  taxCode: z.string(),
  name: z.string(),
  surname: z.string(),
  email: z.email(),
  workContacts: z.record(z.string(), z.string()),
});

export type UserDetails = z.infer<typeof readUserOutput>;

export async function readUser(input: {
  institutionId: string;
  userId: string;
}) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/users/${input.userId}`,
    {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
      },
      output: readUserOutput,
    },
  );

  return { data, error };
}

export async function updateUser(input: {
  status: string;
  product: string;
  institution: string;
  user: string;
}) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/internal/v1/users/${input.user}/status?status=${input.status}&productId=${input.product}&institutionId=${input.institution}`,
    {
      method: "PUT",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
      },
    },
  );

  return { data, error };
}
