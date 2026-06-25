import dayjs from 'dayjs'
import { Institution } from '../../../types/institution'
import SubunitCodes from '../../../types/subunit-codes'
import getProduct from '../../../utils/getProduct'
import getSubunitLabel from '../../../utils/getSubunitLabel'
import {
  blockActions,
  blockButton,
  blockContext,
  blockDivider,
  blockSection,
  blockSectionSelect,
  blockText,
} from '../../block'

const getInstitutionDetailMessage = (
  taxCode: string,
  subunitCode: string,
  institution: Institution,
) => {
  const attributes = institution.attributes?.at(0)
  const products = institution.onboarding
  console.log(taxCode, subunitCode)

  products.sort((firstProduct, secondProduct) => {
    const firstValue = getProduct(firstProduct.productId)
    const secondValue = getProduct(secondProduct.productId)

    return firstValue < secondValue ? -1 : firstValue > secondValue ? 1 : 0
  })

  const blocks = [
    blockSection({
      text: blockText(
        `📍 *${institution.description}${institution.rootParent && ' - ' + institution.rootParent.description}*`,
      ),
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
          `*Data Creazione*: \`${dayjs(institution.createdAt).format('DD-MM-YYYY')}\``,
        ),
      ],
    }),
    blockSection({
      fields: [
        blockText(`*Institution type*: \`${institution.institutionType}\``),
        blockText(
          `*Codice fiscale*: \`${institution.taxCode || 'Non presente'}\``,
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
    getSubunitCodeSection(institution.subunitType),
    blockSectionSelect({
      action_id: 'product_detail',
      label: 'Seleziona un prodotto per visualizzare le sue informazioni',
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
    blockActions({
      block_id: 'buttons_actions',
      elements: [
        blockButton({
          text: blockText('Deleghe', 'plain_text', true),
          style: 'danger',
          value: `${institution.id}`,
          action_id: 'delegations',
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

  return { blocks: blocks.filter((value) => value !== undefined) }
}

const getSubunitCodeSection = (subunitType?: SubunitCodes) => {
  if (!subunitType) {
    return
  }

  return blockSection({
    fields: [blockText(`*Tipologia*: \`${getSubunitLabel(subunitType)}\``)],
  })
}

export default getInstitutionDetailMessage
