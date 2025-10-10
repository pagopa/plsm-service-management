import { KnownBlock } from '@slack/bolt'
import dayjs from 'dayjs'
import { Institution } from '../../../types/institution'
import { Product } from '../../../types/product'
import getProduct from '../../../utils/getProduct'
import {
  blockDivider,
  blockSection,
  blockText,
  blockActions,
  blockButton,
} from '../../block'
import PRODUCT_LITERALS from '../../../types/product-literals'

const getProductDetailMessage = (
  institution: Institution,
  onboarding: {
    id: string
    productId: string
    billing?: { recipientCode?: string; vatNumber?: string }
  },
  product: Product,
  taxCode: string,
  productId: string,
  subunitCode?: string,
): { blocks: Array<KnownBlock> } => {
  const blocks: Array<KnownBlock> = []

  blocks.push(blockDivider())
  blocks.push(
    blockSection({
      text: blockText(`*Contract ID*: \`${onboarding.id}\``),
    }),
  )

  if (product.billing.taxCodeInvoicing) {
    blocks.push(
      blockSection({
        text: blockText(
          `*Codice Fiscale Fatturazione*: \`${product.billing.taxCodeInvoicing}\``,
        ),
      }),
    )
  }

  blocks.push(
    blockSection({
      fields: [
        blockText(`*Prodotto*: \`${getProduct(product.productId)}\``),
        blockText(`*Stato*: \`${product.status}\``),
      ],
    }),
  )
  blocks.push(
    blockSection({
      fields: [
        blockText(
          `*Codice SDI*: \`${onboarding.billing?.recipientCode || 'Non presente'}\``,
        ),
        blockText(
          `*P.IVA*: \`${onboarding.billing?.vatNumber || 'Non presente'}\``,
        ),
      ],
    }),
  )
  blocks.push(
    blockSection({
      fields: [
        blockText(
          `*Data Creazione*: \`${dayjs(product.createdAt).format(
            'DD-MM-YYYY',
          )}\``,
        ),
        blockText(
          `*Data Aggiornamento*: \`${dayjs(product.updatedAt).format(
            'DD-MM-YYYY',
          )}\``,
        ),
      ],
    }),
  )

  if (product.productId === PRODUCT_LITERALS.IO_SIGN) {
    blocks.push(
      blockSection({
        fields: [blockText(`*Support email*: \`${institution.supportEmail}\``)],
      }),
    )
  }

  blocks.push(
    blockActions({
      block_id: 'actions1',
      elements: [
        blockButton({
          text: blockText('Utenti', 'plain_text', true),
          value: `${institution.id}_${product.productId}`,
          action_id: 'users',
        }),
        blockButton({
          text: blockText('Contratto', 'plain_text', true),
          style: 'danger',
          value: `${taxCode}_${productId}_${subunitCode}`,
          action_id: 'contract',
        }),
      ],
    }),
  )

  return {
    blocks,
  }
}

export default getProductDetailMessage
