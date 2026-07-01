import { Institution } from '../types/institution'
import messages from '../utils/messages'
import { envData } from '../utils/validateEnv'

export const getInstitution = async (
  taxCode: string,
  subunitCode?: string,
): Promise<Institution> => {
  const response = await fetch(
    `${envData.INSTITUTION_URL}?taxCode=${taxCode}${
      subunitCode && subunitCode !== 'undefined'
        ? '&subunitCode=' + subunitCode
        : ''
    }`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': envData.CONTRACT_APIM_SUBSCRIPTION_KEY,
      },
    },
  )
  const body = await response.json()

  if (!response.ok) {
    throw new Error(messages.errors.generic)
  }

  if (!body.institutions || body.institutions.length === 0) {
    throw new Error(messages.institution.notFound)
  }

  const institution: Institution = body.institutions[0]
  return institution
}

export const getInstitutionByTaxCode = async (taxCode: string) => {
  const response = await fetch(
    `${envData.INSTITUTION_URL}?taxCode=${taxCode}&enableSubunits=true`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': envData.CONTRACT_APIM_SUBSCRIPTION_KEY,
      },
    },
  )

  if (!response.ok) {
    console.log(response.status)
    throw new Error(messages.errors.generic)
  }

  const body = await response.json()

  if (!body.institutions || body.institutions.length === 0) {
    throw new Error(messages.institution.notFound)
  }

  const items: Array<Institution> = body.institutions.map(
    (item: Institution) => ({
      id: item.id,
      description: item.description,
      digitalAddress: item.digitalAddress,
      institutionType: item.institutionType,
      taxCode: item.taxCode,
      origin: item.origin,
      attributes: item.attributes,
      onboarding: item.onboarding,
      rootParent: item.rootParent,
      subunitType: item.subunitType,
      subunitCode: item.subunitCode,
      supportEmail: item.supportEmail,
      createdAt: item.createdAt,
    }),
  )

  const root = items.find((item) => !item.rootParent)

  if (!root) {
    throw new Error(messages.institution.notFound)
  }

  const institutions = items.filter((item) => !!item.rootParent)

  return { root, institutions }
}
