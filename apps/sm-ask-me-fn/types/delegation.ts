import { z } from 'zod'

export const delegationSchema = z.object({
  id: z.string(),
  institutionId: z.string(),
  institutionName: z.string(),
  type: z.string(),
  productId: z.string(),
  taxCode: z.string(),
  institutionType: z.string(),
  brokerId: z.string(),
  brokerTaxCode: z.string(),
  brokerType: z.string(),
  brokerName: z.string(),
  status: z.enum(['ACTIVE']),
})

export type Delegation = z.infer<typeof delegationSchema>
