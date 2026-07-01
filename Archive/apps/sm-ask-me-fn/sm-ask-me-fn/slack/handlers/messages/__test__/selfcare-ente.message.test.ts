import {
  blockActions,
  blockButton,
  blockContext,
  blockDivider,
  blockSection,
  blockSelect,
  blockText,
} from '../../../block'

describe('Selfcare Ente Message', () => {
  it('should create a valid block', () => {
    const taxCode = 1
    const subunitCode = 1
    const institution = {
      id: 1,
      description: 'ACTIVE',
      digitalAddress: {
        recipientCode: 50,
        vatNumber: 2,
      },
      institutionType: 100,
      taxCode: 100,
      createdAt: 1,
    }
    const attributes = {
      description: 'DESCRIPTION',
      code: 'CODE',
    }
    const products = [
      { productId: 1, status: 'ACTIVE' },
      { productId: 2, status: 'ACTIVE' },
    ]
    const getProduct = (id: number) => id.toLocaleString()
    const dayjs = (createdAt: number) => {
      return {
        format: (format: string) => `${format} - ${createdAt}`,
      }
    }
    const block = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📍 *${institution.description}*`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `:email: *PEC:* ${institution.digitalAddress}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*ID*: \`${institution.id}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Origin*: \`IPA\``,
          },
        ],
      },

      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Ragione Sociale*: \`${institution.description}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Data Creazione*: \`${dayjs(institution.createdAt).format(
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
            text: `*Institution type*: \`${institution.institutionType}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Codice fiscale*: \`${
              institution.taxCode || 'Non presente'
            }\``,
          },
        ],
      },
      attributes && {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Descrizione*: \`${attributes.description}\``,
          },
          {
            type: 'mrkdwn',
            text: `*Category*: \`${attributes.code}\``,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'actions',
        block_id: 'actions1',
        elements: [
          {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Seleziona un prodotto',
            },
            action_id: 'product_detail',
            options: products
              .filter((product) => product.status === 'ACTIVE')
              .map((product) => {
                return {
                  text: {
                    type: 'plain_text',
                    text: getProduct(product.productId),
                  },
                  value: `${taxCode}_${subunitCode}_${product.productId}`,
                }
              }),
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Storico adesioni',
              emoji: true,
            },
            style: 'primary',
            value: `${taxCode}_${subunitCode}`,
            action_id: 'products',
          },
        ],
      },
    ]
    const result = [
      blockSection({
        text: blockText(`📍 *${institution.description}*`),
      }),
      blockContext({
        elements: [blockText(`:email: *PEC:* ${institution.digitalAddress}`)],
      }),
      blockDivider(),
      blockSection({
        fields: [
          blockText(`*ID*: \`${institution.id}\``),
          blockText(`*Origin*: \`IPA\``),
        ],
      }),
      blockSection({
        fields: [
          blockText(`*Ragione Sociale*: \`${institution.description}\``),
          blockText(
            `*Data Creazione*: \`${dayjs(institution.createdAt).format(
              'DD-MM-YYYY'
            )}\``
          ),
        ],
      }),
      blockSection({
        fields: [
          blockText(`*Institution type*: \`${institution.institutionType}\``),
          blockText(
            `*Codice fiscale*: \`${institution.taxCode || 'Non presente'}\``
          ),
        ],
      }),
      attributes &&
        blockSection({
          fields: [
            blockText(`*Descrizione*: \`${attributes.description}\``),
            blockText(`*Category*: \`${attributes.code}\``),
          ],
        }),
      blockDivider(),
      blockActions({
        block_id: 'actions1',
        elements: [
          blockSelect({
            action_id: 'product_detail',
            placeholder: blockText('Seleziona un prodotto', 'plain_text'),
            options: products
              .filter((product) => product.status === 'ACTIVE')
              .map((product) => {
                return {
                  text: blockText(getProduct(product.productId), 'plain_text'),
                  value: `${taxCode}_${subunitCode}_${product.productId}`,
                }
              }),
          }),

          blockButton({
            text: blockText('Storico adesioni', 'plain_text', true),
            style: 'primary',
            value: `${taxCode}_${subunitCode}`,
            action_id: 'products',
          }),
        ],
      }),
    ]
    expect(result).toMatchObject(block)
  })
})
