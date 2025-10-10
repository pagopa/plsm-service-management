import { UserResponse } from '../../../services/user.service'
import getProduct from '../../../utils/getProduct'
import { blockDivider, blockSection, blockText } from '../../block'

export const getLegalCommandMessage = (
  fiscalCode: string,
  data: UserResponse,
) => {
  const blocks = [
    blockSection({
      text: blockText(
        `*Informazioni dell'utente con codice fiscale \`${fiscalCode}\`*`,
      ),
    }),
    blockSection({
      fields: [
        blockText(`Nome: \`${data.user.name}\``),
        blockText(`Cognome: \`${data.user.surname}\``),
      ],
    }),
    blockDivider(),
  ]

  if (data.onboardedInstitutions.length > 0) {
    data.onboardedInstitutions.forEach((institution) => {
      blocks.push(
        blockSection({
          fields: [
            blockText(`Ragione sociale: \`${institution.description}\``),
            blockText(
              `Prodotto: \`${getProduct(institution.productInfo.id)}\``,
            ),
            blockText(`Stato: \`${institution.productInfo.status}\``),
          ],
        }),
      )
    })
  } else {
    blocks.push(
      blockSection({
        text: blockText(
          ':eyes: Questo utente non ha nessun prodotto associato su Area Riservata. :eyes:',
        ),
      }),
    )
  }

  return { blocks }
}
