import PRODUCT_LITERALS from '../types/product-literals'

const getProduct = (product: string) => {
  switch (product) {
    case PRODUCT_LITERALS.INTEROP: {
      return 'Interoperabilità'
    }
    case PRODUCT_LITERALS.PAGOPA: {
      return 'Piattaforma pagoPA'
    }
    case PRODUCT_LITERALS.PN: {
      return 'SEND'
    }
    case PRODUCT_LITERALS.IO: {
      return 'IO'
    }
    case PRODUCT_LITERALS.IO_PREMIUM: {
      return 'IO Premium'
    }
    case PRODUCT_LITERALS.INTEROP_ATST: {
      return 'Interoperabilità Attestazione'
    }
    case PRODUCT_LITERALS.INTEROP_COLL: {
      return 'Interoperabilità Collaudo'
    }
    case PRODUCT_LITERALS.IO_SIGN: {
      return 'Firma con IO'
    }
    default: {
      return product
    }
  }
}

export default getProduct
