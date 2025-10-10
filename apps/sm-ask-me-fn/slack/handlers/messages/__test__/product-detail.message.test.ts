import {
  blockActions,
  blockButton,
  blockDivider,
  blockSection,
  blockText,
} from '../../../block'

describe('Product Detail Block Message', () => {
  it('should create a valid block message', () => {
    const institution = {
      id: 1,
    }
    const taxCode = 2
    const productId = 3
    const subunitCode = 'xx'
    const product = {
      productId: 1,
      billing: {
        recipientCode: 50,
        vatNumber: 2,
      },
      createdAt: 100,
    }
    const getProduct = (id: number) => id
    const dayjs = (createdAt: number) => {
      return {
        format: (format: string) => `${format} - ${createdAt}`,
      }
    }
    const block = [
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Prodotto*: \`${getProduct(product.productId)}\``,
          },
          {
            type: 'mrkdwn',
            text: '*Stato*: `ACTIVE`',
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Codice SDI*: \`${product.billing.recipientCode}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Data Creazione*: \`${dayjs(product.createdAt).format(
              'DD-MM-YYYY'
            )}\``,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Cod. Fiscale*: \`${product.billing.vatNumber}\``,
          },
          {
            type: 'mrkdwn',
            text: `*P.IVA*: \`${product.billing.vatNumber}\``,
          },
        ],
      },
      {
        type: 'actions',
        block_id: 'actions1',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Utenti',
              emoji: true,
            },
            value: `${institution.id}_${product.productId}`,
            action_id: 'users',
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Contratto',
              emoji: true,
            },
            style: 'danger',
            value: `${taxCode}_${productId}_${subunitCode}`,
            action_id: 'contract',
          },
        ],
      },
    ]

    const result = [
      blockDivider(),
      blockSection({
        fields: [
          blockText(`*Prodotto*: \`${getProduct(product.productId)}\``),
          blockText('*Stato*: `ACTIVE`'),
        ],
      }),
      blockSection({
        fields: [
          blockText(`*Codice SDI*: \`${product.billing.recipientCode}\``),
          blockText(
            `*Data Creazione*: \`${dayjs(product.createdAt).format(
              'DD-MM-YYYY'
            )}\``
          ),
        ],
      }),
      blockSection({
        fields: [
          blockText(`*Cod. Fiscale*: \`${product.billing.vatNumber}\``),
          blockText(`*P.IVA*: \`${product.billing.vatNumber}\``),
        ],
      }),
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
    ]
    expect(result).toMatchObject(block)
  })
})
