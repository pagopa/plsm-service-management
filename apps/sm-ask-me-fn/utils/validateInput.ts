import { SayFn } from '@slack/bolt'
import { z } from 'zod'
import messages from './messages'

const validateInput = async (input: Record<string, string>, say: SayFn) => {
  const schema = z.object({
    taxCode: z
      .string({
        message: messages.validation.fiscalCode.generic,
      })
      .trim()
      .length(11, messages.validation.fiscalCode.generic)
      .regex(/^[0-9]*$/, messages.validation.fiscalCode.generic),
  })
  const result = schema.safeParse(input)

  if (!result.success) {
    await say(result.error.issues[0].message)
    return false
  }

  return true
}

export default validateInput

export const validateTaxCode = (
  taxCode: unknown,
): { data: string; error: null } | { data: null; error: string } => {
  const schema = z.object({
    taxCode: z.preprocess(
      (val) => {
        if (typeof val !== 'string') return val
        const cleaned = val.replace(/[^\d]/g, '')
        return cleaned
      },
      z
        .string({
          message: messages.validation.fiscalCode.generic,
        })
        .length(11, messages.validation.fiscalCode.generic)
        .regex(/^[0-9]{11}$/, messages.validation.fiscalCode.generic),
    ),
  })
  const result = schema.safeParse({ taxCode })

  if (!result.success) {
    return {
      data: null,
      error:
        result.error.issues.at(0)?.message ||
        messages.validation.fiscalCode.generic,
    }
  }

  return { data: result.data.taxCode, error: null }
}
