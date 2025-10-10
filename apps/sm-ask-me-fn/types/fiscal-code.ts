import { z } from 'zod'

const fiscalCodeRegex = new RegExp(
  '^([A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{3}[A-Z]{1})$|([0-9]{11})$',
)

export const schema = z.string().regex(fiscalCodeRegex)

export const validateFiscalCode = (fiscalCode: string) => {
  const result = schema.safeParse(fiscalCode)

  if (!result.success) {
    throw new Error('Inserisci un codice fiscale corretto')
  }

  return fiscalCode
}
