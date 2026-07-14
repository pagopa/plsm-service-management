import {
  blockActions,
  blockButton,
  blockContext,
  blockDivider,
  blockSection,
  blockSelect,
  blockText,
} from '../../../block'

const block = [
  {
    type: 'divider',
  },
  {
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Prodotto*: Test`,
      },
      {
        type: 'mrkdwn',
        text: '*Stato*: `ACTIVE`',
      },
    ],
  },
  {
    type: 'section',
    text: {
      type: 'plain_text',
      text: `*Prodotto*: Test`,
    },
  },
  {
    type: 'section',
    fields: [
      {
        type: 'plain_text',
        text: `*Codice SDI*: SID TEST`,
      },
      {
        type: 'plain_text',
        text: `*Data Creazione*: 01/01/2021`,
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
        value: `Valore`,
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
        value: `Valore`,
        action_id: 'contract',
      },
    ],
  },
]
const block2 = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `📍 *DESCRIPTION*`,
    },
  },
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `:email: *PEC:*EMAIL`,
      },
    ],
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
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'TESTO1',
            },
            value: `VALUE`,
          },
          {
            text: {
              type: 'plain_text',
              text: 'TESTO2',
            },
            value: `VALUE`,
          },
        ],
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Storico adesioni',
          emoji: true,
        },
        style: 'primary',
        value: `TAXCODE`,
        action_id: 'products',
      },
    ],
  },
]
const block3 = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `📍 *DESCRIPTION*`,
    },
  },
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `:email: *PEC:*`,
      },
    ],
  },
]
describe('Create a block', () => {
  it('should create a block', () => {
    const result = [
      blockDivider(),
      blockSection({
        fields: [blockText(`*Prodotto*: Test`), blockText('*Stato*: `ACTIVE`')],
      }),
      blockSection({
        text: blockText(`*Prodotto*: Test`, 'plain_text'),
      }),
      blockSection({
        fields: [
          blockText(`*Codice SDI*: SID TEST`, 'plain_text'),
          blockText(`*Data Creazione*: 01/01/2021`, 'plain_text'),
        ],
      }),

      blockActions({
        block_id: 'actions1',
        elements: [
          blockButton({
            text: {
              text: 'Utenti',
              emoji: true,
            },
            value: `Valore`,
            action_id: 'users',
          }),
          blockButton({
            text: {
              text: 'Contratto',
              emoji: true,
            },
            style: 'danger',
            value: `Valore`,
            action_id: 'contract',
          }),
        ],
      }),
    ]

    expect(result).toEqual(block)
  })
  it('should create a block 2', () => {
    const result = [
      blockSection({
        text: blockText(`📍 *DESCRIPTION*`),
      }),
      blockContext({
        elements: [blockText(`:email: *PEC:*EMAIL`)],
      }),
      blockActions({
        block_id: 'actions1',
        elements: [
          blockSelect({
            action_id: 'product_detail',
            options: [
              {
                text: blockText('TESTO1'),
                value: `VALUE`,
              },
              {
                text: blockText('TESTO2'),
                value: `VALUE`,
              },
            ],
            placeholder: {
              text: 'Seleziona un prodotto',
            },
          }),
          blockButton({
            text: blockText('Storico adesioni', 'plain_text', true),
            style: 'primary',
            value: `TAXCODE`,
            action_id: 'products',
          }),
        ],
      }),
    ]

    expect(result).toEqual(block2)
  })
  it('should create a block 3', () => {
    const result = [
      blockSection({
        text: blockText(`📍 *DESCRIPTION*`),
      }),
      blockContext({
        elements: [blockText(`:email: *PEC:*`)],
      }),
    ]
    expect(result).toEqual(block3)
  })
})
