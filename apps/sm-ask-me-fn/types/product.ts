import { ProductStatus } from './product-status'

export type Product = {
  status: ProductStatus
  productId: string
  billing: {
    recipientCode: string
    vatNumber: string
    taxCodeInvoicing?: string
  }
  createdAt: Date
  updatedAt: Date
}
