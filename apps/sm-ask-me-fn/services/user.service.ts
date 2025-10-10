import { z, ZodError } from 'zod'
import { envData } from '../utils/validateEnv'
import messages from '../utils/messages'

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
      state: z.enum(['ACTIVE', 'DELETED', 'PENDING']),
      zipCode: z.string(),
      userEmail: z.string().email(),
      productInfo: z.object({
        id: z.string(),
        role: z.enum(['OPERATOR', 'DELEGATE', 'SUB_DELEGATE']),
        productRole: z.string(),
        createdAt: z.string(),
        status: z.enum(['ACTIVE', 'DELETED', 'TOBEVALIDATED']),
      }),
    }),
  ),
})

export type UserResponse = z.infer<typeof userResponseSchema>

type GetUserResponse = UserResponse | { message: string; error?: ZodError }

export const getUser = async (fiscalCode: string): Promise<GetUserResponse> => {
  const response = await fetch(
    'https://api.selfcare.pagopa.it/external/v2/users',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': envData.OCP_APIM_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify({
        fiscalCode,
      }),
    },
  )

  if (response.status === 404) {
    throw new Error(messages.users.notFound)
  }

  if (!response.ok) {
    throw new Error(messages.errors.generic)
  }

  const validationResult = userResponseSchema.safeParse(await response.json())
  if (!validationResult.success) {
    console.log({ message: 'validation error', error: validationResult.error })
    throw new Error(messages.errors.generic)
  }

  return validationResult.data
}
