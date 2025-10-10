import { z } from 'zod'
import { Delegation, delegationSchema } from '../types/delegation'
import { envData } from '../utils/validateEnv'

const responseSchema = z.array(delegationSchema)

export const getDelegations = async (
  institutionId: string,
): Promise<Array<Delegation>> => {
  const response = await fetch(
    `https://api.selfcare.pagopa.it/external/support/v1/delegations?institutionId=${institutionId}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': envData.CONTRACT_APIM_SUBSCRIPTION_KEY,
      },
    },
  )
  const body = await response.json()
  if (!response.ok) {
    throw new Error('Si è verificato un errore riprova più tardi.')
  }

  const validation = responseSchema.safeParse(body)
  if (!validation.success) {
    throw new Error('Si è verificato un errore riprova più tardi')
  }

  return validation.data
}
