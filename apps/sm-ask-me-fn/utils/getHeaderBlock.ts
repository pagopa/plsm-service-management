import { KnownBlock } from '@slack/bolt'

export const getHeaderBlock: (label: string) => Array<KnownBlock> = (label) => {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: label,
        emoji: true,
      },
    },
    { type: 'divider' },
  ]
}
