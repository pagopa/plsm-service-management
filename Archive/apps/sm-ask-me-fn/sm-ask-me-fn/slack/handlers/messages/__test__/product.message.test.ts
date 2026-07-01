import { KnownBlock } from '@slack/bolt'
import { blockDivider, blockSection, blockText } from '../../../block'
import getProduct from '../../../../utils/getProduct'
import getProductStatusMessage from '../../../../utils/getProductStatusMessage'
import { ProductStatus } from '../../../../types/product-status'
import dayjs from 'dayjs'

const randomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
}

const products = [
  {
    productId: '1',
    status: 'ACTIVE' as ProductStatus,
    createdAt: randomDate(new Date(2012, 0, 1), new Date()),
  },
  {
    productId: '2',
    status: 'ACTIVE' as ProductStatus,
    createdAt: randomDate(new Date(2012, 0, 1), new Date()),
  },
  {
    productId: '3',
    status: 'ACTIVE' as ProductStatus,
    createdAt: randomDate(new Date(2012, 0, 1), new Date()),
  },
]
describe('Product Block Message', () => {
  const sortedProducts = products.sort((firstProduct, secondProduct) => {
    if (firstProduct.createdAt < secondProduct.createdAt) {
      return -1
    }

    if (firstProduct.createdAt > secondProduct.createdAt) {
      return 1
    }

    return 0
  })
  const sortedProducts2 = products.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )

  it('should produce the same sorting products', () => {
    expect(sortedProducts).toBe(sortedProducts2)
  })
  it('it should create the same blocks', () => {
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
    sortedProducts.forEach((product, index) => {
      blocks.push(
        { type: 'divider' },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `${index + 1} - *${getProduct(product.productId)}*`,
            },
            {
              type: 'mrkdwn',
              text: getProductStatusMessage(product.status),
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'plain_text',
              text: 'Data adesione:',
            },
            {
              type: 'mrkdwn',
              text: `\`${dayjs(product.createdAt).format('DD-MM-YYYY')}\``,
            },
          ],
        }
      )
    })

    const blocks2: Array<KnownBlock> = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Storico adesioni',
          emoji: true,
        },
      },
    ]
    sortedProducts2.forEach((product, index) => {
      blocks2.push(
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

    expect(blocks2).toMatchObject(blocks)
  })

  it('should create a valid block', () => {
    const index = 1
    const product = products[Math.floor(Math.random() * products.length)]

    const block = [
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `${index + 1} - *${getProduct(product.productId)}*`,
          },
          {
            type: 'mrkdwn',
            text: getProductStatusMessage(product.status),
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'plain_text',
            text: 'Data adesione:',
          },
          {
            type: 'mrkdwn',
            text: `\`${dayjs(product.createdAt).format('DD-MM-YYYY')}\``,
          },
        ],
      },
    ]
    const result = [
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
      }),
    ]
    expect(result).toMatchObject(block)
  })
})
