"use server";

import { redirect } from "next/navigation";
import z from "zod";
import { getCurrentPermissionCodes } from "@/lib/auth/dashboard-access";
import { requireServerSession } from "@/lib/auth/server";
import {
  updateInstitutionInfo,
  updateInstitutionInfoPNPG,
} from "../services/institution.service";
import { sendQueueMessage } from "../services/product.service";

const updateInstitutionSchema = z.object({
  redirect: z.string().nonempty(),
  institutionId: z.string().nonempty(),
  address: z.string().nonempty(),
  description: z.string().nonempty(),
  digitalAddress: z.string().nonempty(),
  zipCode: z.string().nonempty(),
  // Alcuni enti hanno origin/originId anche a livello top-level per refusi
  // storici: li accettiamo senza usarli, i valori validi stanno in onboardings.
  origin: z.string().optional(),
  originId: z.string().optional(),
  sendToQueue: z.string().transform((v) => v === "true"),
  onboarding: z.string().optional().nullable(),
  onboardings: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;

      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    },
    z.array(
      z.object({
        productId: z.string().nonempty(),
        vatNumber: z.string().optional(),
        origin: z.string().optional(),
        originId: z.string().optional(),
      }),
    ),
  ),
});

export type UpdateInstitutionFormState = {
  errors?: Record<string, string>;
};

type InstitutionScope = "overview" | "pnpg";

function getSafeReturnUrl(value: string, scope: InstitutionScope) {
  if (!value.startsWith("/") || value.startsWith("//")) return null;

  try {
    const url = new URL(value, "https://app.invalid");

    if (
      url.origin !== "https://app.invalid" ||
      !url.pathname.startsWith(`/dashboard/${scope}/`)
    ) {
      return null;
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

async function updateInstitutionFor(
  scope: InstitutionScope,
  formData: FormData,
): Promise<UpdateInstitutionFormState> {
  await requireServerSession(`/dashboard/${scope}`);

  const permissionCodes = await getCurrentPermissionCodes();
  const canUpdate =
    scope === "overview"
      ? permissionCodes.has("overview.read") &&
        permissionCodes.has("overview.write")
      : permissionCodes.has("pnpg.read");

  if (!canUpdate) {
    return {
      errors: { root: "Non hai il permesso di modificare l'ente." },
    };
  }

  const input = Object.fromEntries(formData.entries());
  const validation = updateInstitutionSchema.safeParse(input);

  if (!validation.success) {
    const errors: Record<string, string> = {};

    for (const issue of validation.error.issues) {
      if (issue.path.length > 0) {
        const field = issue.path[0] as string;
        errors[field] = issue.message;
      }
    }

    return {
      errors: {
        ...errors,
        root: validation.error.issues[0]?.message ?? "Dati non validi.",
      },
    };
  }

  const returnUrl = getSafeReturnUrl(validation.data.redirect, scope);

  if (!returnUrl) {
    return { errors: { root: "Percorso di ritorno non valido." } };
  }

  const { error } =
    scope === "pnpg"
      ? await updateInstitutionInfoPNPG({
          institutionId: validation.data?.institutionId,
          address: validation.data.address,
          description: validation.data.description,
          digitalAddress: validation.data.digitalAddress,
          zipCode: validation.data.zipCode,
          onboardings: validation.data?.onboardings,
        })
      : await updateInstitutionInfo({
          institutionId: validation.data?.institutionId,
          address: validation.data.address,
          description: validation.data.description,
          digitalAddress: validation.data.digitalAddress,
          zipCode: validation.data.zipCode,
          onboardings: validation.data?.onboardings,
        });

  if (error) {
    return {
      errors: { root: error },
    };
  }

  if (validation.data.sendToQueue && validation.data.onboarding) {
    await sendQueueMessage(validation.data.onboarding);
  }

  redirect(returnUrl);
}

export async function updateOverviewInstitutionAction(
  _prevState: UpdateInstitutionFormState,
  formData: FormData,
): Promise<UpdateInstitutionFormState> {
  return updateInstitutionFor("overview", formData);
}

export async function updatePnpgInstitutionAction(
  _prevState: UpdateInstitutionFormState,
  formData: FormData,
): Promise<UpdateInstitutionFormState> {
  return updateInstitutionFor("pnpg", formData);
}
