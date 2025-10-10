import dayjs from 'dayjs'
import getProduct from '../../../utils/getProduct'
import { Institution } from '../../../types/institution'
import {
  blockActions,
  blockButton,
  blockContext,
  blockDivider,
  blockSection,
  blockSectionSelect,
  blockText,
} from '../../block'
import getSubunitLabel from '../../../utils/getSubunitLabel'
import SubunitCodes from '../../../types/subunit-codes'

const getSelfcareEnteMessage = ({
  taxCode,
  subunitCode,
  root,
  institutions,
}: {
  taxCode: string
  subunitCode: string
  root: Institution
  institutions: Array<Institution>
}) => {
  const attributes = root.attributes?.at(0)
  const products = root.onboarding

  products.sort((firstProduct, secondProduct) => {
    const firstValue = getProduct(firstProduct.productId)
    const secondValue = getProduct(secondProduct.productId)

    return firstValue < secondValue ? -1 : firstValue > secondValue ? 1 : 0
  })

  const blocks = [
    blockSection({
      text: blockText(`📍 *${root.description}*`),
    }),
    blockContext({
      elements: [blockText(`:email: *PEC:* ${root.digitalAddress}`)],
    }),
    blockDivider(),
    blockSection({
      fields: [
        blockText(`*ID*: \`${root.id}\``),
        blockText(`*Origin*: \`${root.origin || 'Non presente'}\``),
      ],
    }),
    blockSection({
      fields: [
        blockText(`*Ragione Sociale*: \`${root.description}\``),
        blockText(
          `*Data Creazione*: \`${dayjs(root.createdAt).format('DD-MM-YYYY')}\``,
        ),
      ],
    }),
    blockSection({
      fields: [
        blockText(`*Institution type*: \`${root.institutionType}\``),
        blockText(`*Codice fiscale*: \`${root.taxCode || 'Non presente'}\``),
      ],
    }),
    attributes &&
      blockSection({
        fields: [
          blockText(`*Descrizione*: \`${attributes.description}\``),
          blockText(`*Category*: \`${attributes.code}\``),
        ],
      }),
    getSubunitCodeSection(root.subunitType),
    blockDivider(),
    blockSectionSelect({
      action_id: 'institution_detail',
      label: "Ecco le sub-unit per l'ente apicale",
      placeholder: blockText('Seleziona una sub-unit', 'plain_text'),
      options: institutions.map((item) => ({
        text: blockText(item.description, 'plain_text'),
        value: `${taxCode}_${item.subunitCode}`,
      })),
    }),
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
          value: `${root.id}`,
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

export default getSelfcareEnteMessage
