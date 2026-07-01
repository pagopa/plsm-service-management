import { Product } from './product'
import SubunitCodes from './subunit-codes'

export type Institution = {
  id: string
  description: string
  digitalAddress: string
  institutionType: string
  taxCode?: string
  origin?: string
  attributes: Array<{ code: string; description: string }>
  onboarding: Array<Product>
  rootParent?: {
    description: string
  }
  subunitType?: SubunitCodes
  subunitCode?: string
  supportEmail?: string
  createdAt: Date
}
