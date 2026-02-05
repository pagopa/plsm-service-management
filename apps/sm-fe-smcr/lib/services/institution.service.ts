"use server";

import { betterFetch } from "@better-fetch/fetch";
import { z } from "zod";
import logger from "@/lib/logger/logger.server";

const OnboardingSchema = z.object({
  productId: z.string(),
  tokenId: z.string(),
  status: z.string(),
  billing: z
    .object({
      vatNumber: z.string().optional(),
      recipientCode: z.string().optional(),
      publicServices: z.boolean(),
      taxCodeInvoicing: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
  isAggregator: z.boolean().optional(),
  updatedAt: z.string().optional(),
  institutionType: z.string().optional(),
  origin: z.string().optional(),
  originId: z.string().optional(),
});

const InstitutionSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  origin: z.string(),
  originId: z.string(),
  description: z.string().optional(),
  institutionType: z.string().optional(),
  digitalAddress: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  taxCode: z.string(),
  city: z.string().optional(),
  county: z.string().optional(),
  country: z.string().optional(),
  istatCode: z.string().optional(),
  geographicTaxonomies: z
    .array(
      z.object({
        code: z.string(),
        desc: z.string(),
      }),
    )
    .optional(),
  attributes: z
    .array(
      z.object({
        origin: z.string(),
        code: z.string(),
        description: z.string(),
      }),
    )
    .optional(),
  onboarding: z.array(OnboardingSchema),
  paymentServiceProvider: z
    .object({
      abiCode: z.string(),
      businessRegisterNumber: z.string(),
      legalRegisterNumber: z.string(),
      legalRegisterName: z.string(),
      vatNumberGroup: z.boolean(),
    })
    .optional(),
  rootParent: z
    .object({
      description: z.string(),
      id: z.string(),
    })
    .optional(),
  imported: z.boolean(),
  subunitCode: z.string().optional(),
  subunitType: z.string().optional(),
  aooParentCode: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  delegation: z.boolean(),
});

export type Product = z.infer<typeof OnboardingSchema>;
export type Institution = z.infer<typeof InstitutionSchema>;

export async function getInstitution(taxCode: string) {
  const { data } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/v2/institutions?taxCode=${taxCode}&enableSubunits=true`,
    {
      output: z.array(InstitutionSchema),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
      },
    },
  );

  return (data as any).institutions;
}

type GetInstitutionWithSubunitsResponse =
  | {
    data: Array<Institution>;
    error: null;
  }
  | { data: []; error: "Errore nel recupero dati" | "Nessun ente trovato" };

export async function getInstitutionWithSubunits(
  taxCode: string,
): Promise<GetInstitutionWithSubunitsResponse> {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/institutions?taxCode=${taxCode}&enableSubunits=true`,
    {
      output: z.object({ institutions: z.array(InstitutionSchema) }),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
      },
    },
  );

  if (error || !data) {
    logger.error({
      request: {
        "method": "GET",
        "path": `https://api.selfcare.pagopa.it/external/v2/institutions?taxCode=${taxCode}&enableSubunits=true`
      },
      error: {
        name: error.status,
        message: error.message,
        stack: error.statusText,
      },
    }, `getInstitution ${taxCode} - empty`)
    return { data: [], error: "Errore nel recupero dati" };
  }

  if (data.institutions.length < 1) {
    logger.warn({
      request: {
        "method": "GET",
        "path": `https://api.selfcare.pagopa.it/external/v2/institutions?taxCode=${taxCode}&enableSubunits=true`
      },
      info: {
        event: "getInstitution",
        metadata: data,
      },
    }, `getInstitution ${taxCode} - empty`)
    return { data: [], error: "Nessun ente trovato" };
  }

  logger.info({
    request: {
      "method": "GET",
      "path": `https://api.selfcare.pagopa.it/external/v2/institutions?taxCode=${taxCode}&enableSubunits=true`
    },
    info: {
      event: "getInstitution",
      metadata: data,
    },
  }, `getInstitution called with ${taxCode}`)

  return { data: data.institutions, error: null };
}

export async function getInstitutionPNPG(
  taxCode: string,
): Promise<GetInstitutionWithSubunitsResponse> {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/pn-pg/support/v1/institutions?taxCode=${taxCode}&enableSubunits=true`,
    {
      output: z.object({ institutions: z.array(InstitutionSchema) }),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.FE_SMCR_API_KEY_PNPG as string,
      },
    },
  );

  if (error || !data) {
    console.error(error);
    return { data: [], error: "Errore nel recupero dati" };
  }

  if (data.institutions.length < 1) {
    return { data: [], error: "Nessun ente trovato" };
  }

  return { data: data.institutions, error: null };
}

const zipCodeRegex = /^[0-9]{5}$/;
// const pecRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const UpdateInsitutionInfoSchema = z.object({
  institutionId: z
    .string()
    .nonempty({ message: "L'ID dell'istituzione è obbligatorio." }),

  address: z
    .string()
    .min(5, { message: "L'indirizzo deve contenere almeno 5 caratteri." })
    .refine((val) => val.trim().length > 0, {
      message: "L'indirizzo non può essere vuoto o solo spazi.",
    }),

  description: z
    .string()
    .nonempty({ message: "La descrizione è obbligatoria." }),

  digitalAddress: z.string().optional(),

  zipCode: z
    .string()
    .nonempty({ message: "Lo ZIP è obbligatorio." })
    .regex(zipCodeRegex, {
      message: "Lo ZIP deve essere un numero di 5 cifre.",
    }),

  onboardings: z.array(
    z.object({
      productId: z
        .string()
        .nonempty({ message: "Il productId è obbligatorio." }),
      vatNumber: z
        .string()
        .nonempty({ message: "La partita IVA è obbligatoria." }),
    }),
  ),
});

export type UpdateInsitutionInfoInput = z.infer<
  typeof UpdateInsitutionInfoSchema
>;

export async function updateInstitutionInfo(input: UpdateInsitutionInfoInput) {
  const validation = UpdateInsitutionInfoSchema.safeParse(input);

  if (!validation.success) {
    return {
      error:
        validation.error?.issues.at(0)?.message ||
        "Si è verificato un errore di validazione, ricontrolla i dati e riprova.",
    };
  }

  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/institutions/${input.institutionId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        address: input.address,
        description: input.description,
        digitalAddress: input.digitalAddress,
        geographicTaxonomyCodes: ["ITA"],
        onboardings: input.onboardings,
        zipCode: input.zipCode,
      }),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
        "Content-Type": "application/json",
      },
    },
  );

  if (error || !data) {
    console.error(error);
    return { error: "Si è verificato un errore, riprova più tardi." };
  }

  return { error: null };
}

export async function updateInstitutionInfoPNPG(
  input: UpdateInsitutionInfoInput,
) {
  const validation = UpdateInsitutionInfoSchema.safeParse(input);

  if (!validation.success) {
    return {
      error:
        validation.error?.issues.at(0)?.message ||
        "Si è verificato un errore di validazione, ricontrolla i dati e riprova.",
    };
  }

  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/pn-pg/support/v1/institutions/${input.institutionId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        address: input.address,
        description: input.description,
        digitalAddress: input.digitalAddress,
        onboardings: input.onboardings,
        zipCode: input.zipCode,
      }),
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.FE_SMCR_API_KEY_PNPG as string,
        "Content-Type": "application/json",
      },
    },
  );

  if (error || !data) {
    console.error(error);
    return { error: "Si è verificato un errore, riprova più tardi." };
  }

  return { error: null };
}

const UserGroupStatus = z.enum(["ACTIVE", "SUSPENDED", "DELETED"]);

const ProductId = z.enum([
  "prod-fd",
  "prod-interop",
  "prod-interop-atst",
  "prod-interop-coll",
  "prod-io",
  "prod-io-premium",
  "prod-io-sign",
  "prod-pagopa",
  "prod-pn",
  "prod-fd-garantito",
]);

const UserGroupSchema = z.object({
  id: z.string().min(1, { message: "L'ID è obbligatorio." }),
  institutionId: z.uuid({
    message: "institutionId deve essere un UUID valido.",
  }),
  productId: ProductId,
  name: z.string().min(1, { message: "Il nome è obbligatorio." }),
  description: z.string().min(1, { message: "La descrizione è obbligatoria." }),
  status: UserGroupStatus,
  members: z.array(
    z.uuid({ message: "Ogni member deve essere un UUID valido." }),
  ),
  createdAt: z.iso.datetime({
    message: "createdAt deve essere una data ISO valida.",
  }),
  createdBy: z.uuid({ message: "createdBy deve essere un UUID valido." }),

  // Presenti solo in alcuni record
  modifiedAt: z.iso
    .datetime({ message: "modifiedAt deve essere una data ISO valida." })
    .optional(),
  modifiedBy: z
    .uuid({ message: "modifiedBy deve essere un UUID valido." })
    .optional(),
});

const UserGroupsSchema = z.object({
  content: z.array(UserGroupSchema),
  totalElements: z
    .number()
    .int()
    .nonnegative({ message: "totalElements deve essere un intero ≥ 0." }),
  totalPages: z
    .number()
    .int()
    .nonnegative({ message: "totalPages deve essere un intero ≥ 0." }),
  number: z.number().int().nonnegative({
    message: "number (indice pagina) deve essere un intero ≥ 0.",
  }),
  size: z
    .number()
    .int()
    .positive({ message: "size deve essere un intero > 0." }),
});

export type UserGroup = z.infer<typeof UserGroupSchema>;
export type UserGroups = z.infer<typeof UserGroupsSchema>;

export async function getUserGroups(input: { institution: string }) {
  const { data, error } = await betterFetch(
    `https://api.selfcare.pagopa.it/external/support/v1/user-groups?institutionId=${input.institution}`,
    {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env
          .FE_SMCR_API_KEY_INSTITUTION as string,
      },
      output: UserGroupsSchema,
    },
  );

  if (error || !data) {
    console.error(error);
    return { error: "Si è verificato un errore, riprova più tardi." };
  }

  return { data, error: null };
}
