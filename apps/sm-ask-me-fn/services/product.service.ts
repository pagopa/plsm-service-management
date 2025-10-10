import { z } from 'zod'
import { envData } from '../utils/validateEnv'
import messages from '../utils/messages'

const productSchema = z.object({
  id: z.string(),
  productId: z.string(),
  status: z.string(),
  billing: z.optional(
    z.object({
      recipientCode: z.optional(z.string()),
      vatNumber: z.optional(z.string()),
    }),
  ),
})

const productsResponseSchema = z.array(productSchema)

type Product = z.infer<typeof productSchema>

export const getProduct = async (
  taxCode: string,
  subunitCode: string,
  productId: string,
): Promise<Product> => {
  const response = await fetch(
    `https://api.selfcare.pagopa.it/external/support/v1/onboarding/institutionOnboardings?taxCode=${taxCode}${
      subunitCode && subunitCode !== 'undefined'
        ? '&subunitCode=' + subunitCode
        : ''
    }`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': envData.CONTRACT_APIM_SUBSCRIPTION_KEY,
      },
    },
  )

  if (!response.ok) {
    throw new Error(messages.errors.generic)
  }

  const body = await response.json()
  const data = productsResponseSchema.parse(body)

  const product = data
    .filter((item) => item.status === 'COMPLETED')
    .find((item) => item.productId === productId)
  if (!product) {
    throw new Error(messages.errors.generic)
  }

  return product
}
