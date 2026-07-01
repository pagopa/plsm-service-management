import { ProductStatus } from '../types/product-status'
import { STATUS_EMOJIS } from '../types/status-emojis'

const getProductStatusMessage = (status: ProductStatus): string => {
  switch (status) {
    case 'ACTIVE': {
      return `${STATUS_EMOJIS.SUCCESS} ${status}`
    }
    case 'DELETED': {
      return `${STATUS_EMOJIS.ERROR} ${status}`
    }
    default: {
      return `${STATUS_EMOJIS.WARNING} ${status}`
    }
  }
}

export default getProductStatusMessage
