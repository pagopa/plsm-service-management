import { KnownBlock } from '@slack/bolt'
import { Product } from '../../../types/product'
import getProduct from '../../../utils/getProduct'
import getProductStatusMessage from '../../../utils/getProductStatusMessage'
import dayjs from 'dayjs'
import { blockDivider, blockSection, blockText } from '../../block'

const getProductsMessage = (
  products: Array<Product>
): { blocks: Array<KnownBlock> } => {
  const blocks: Array<KnownBlock> = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Storico adesioni',
        emoji: true,
      },
    },
  ]

  const sortedProducts = products.sort((firstProduct, secondProduct) => {
    if (firstProduct.createdAt < secondProduct.createdAt) {
      return -1
    }

    if (firstProduct.createdAt > secondProduct.createdAt) {
      return 1
    }

    return 0
  })

  sortedProducts.forEach((product, index) => {
    blocks.push(
      blockDivider(),
      blockSection({
        fields: [
          blockText(`${index + 1} - *${getProduct(product.productId)}*`),
          blockText(getProductStatusMessage(product.status)),
        ],
      }),
      blockSection({
        fields: [
          blockText('Data adesione:', 'plain_text'),
          blockText(`\`${dayjs(product.createdAt).format('DD-MM-YYYY')}\``),
        ],
      })
    )
  })

  return { blocks }
}

export default getProductsMessage
