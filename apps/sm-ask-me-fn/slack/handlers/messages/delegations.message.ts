import { KnownBlock } from '@slack/bolt'
import { Delegation } from '../../../types/delegation'
import { blockDivider, blockSection, blockText } from '../../block'

const getDelegationsMessage = (delegations: Array<Delegation>) => {
  if (delegations.length === 0) {
    return {
      blocks: [
        blockSection({
          text: blockText(`*Questo ente non ha nessuna delega*`),
        }),
      ],
    }
  }

  const blocks: Array<KnownBlock> = [
    blockSection({
      text: blockText(
        `:round_pushpin:*${delegations[0].institutionName}* ha le seguenti deleghe`,
      ),
    }),
  ]

  delegations.forEach((delegation) => {
    blocks.push(
      blockDivider(),
      blockSection({
        fields: [
          blockText(`*Ragione Sociale*: \`${delegation.brokerName}\``),
          blockText(`*Codice Fiscale*: \`${delegation.brokerTaxCode}\``),
          blockText(`*Tipologia*: \`${delegation.type}\``),
          blockText(`*Stato*: \`${delegation.status}\``),
        ],
      }),
    )
  })

  return { blocks }
}

export default getDelegationsMessage
