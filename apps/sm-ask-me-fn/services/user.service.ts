import { z, ZodError } from "zod";
import { envData } from "../utils/validateEnv";
import messages from "../utils/messages";

const userResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
    surname: z.string(),
  }),
  onboardedInstitutions: z.array(
    z.object({
      id: z.string().uuid(),
      description: z.string(),
      institutionType: z.string(),
      digitalAddress: z.string().email(),
      address: z.string(),
      state: z.enum(["ACTIVE", "DELETED", "PENDING"]),
      zipCode: z.string(),
      userEmail: z.string().email(),
      productInfo: z.object({
        id: z.string(),
        role: z.enum(["OPERATOR", "DELEGATE", "SUB_DELEGATE"]),
        productRole: z.string(),
        createdAt: z.string(),
        status: z.enum(["ACTIVE", "DELETED", "TOBEVALIDATED"]),
      }),
    }),
  ),
});

export type UserResponse = z.infer<typeof userResponseSchema>;

type GetUserResponse =
  | { data: UserResponse; error: null }
  | { data: null; error: string };

export const getUser = async (fiscalCode: string): Promise<GetUserResponse> => {
  const response = await fetch(
    "https://api.selfcare.pagopa.it/external/v2/users",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": envData.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify({
        fiscalCode,
      }),
    },
  );

  if (response.status === 404) {
    console.warn("getUser - not found");
    return { data: null, error: messages.users.notFound };
  }

  if (!response.ok) {
    console.error("getUser - generic error");
    return { data: null, error: messages.errors.generic };
  }

  const validationResult = userResponseSchema.safeParse(await response.json());
  if (!validationResult.success) {
    console.log({ message: "validation error", error: validationResult.error });
    return { data: null, error: messages.errors.generic };
  }

  return { data: validationResult.data, error: null };
};
