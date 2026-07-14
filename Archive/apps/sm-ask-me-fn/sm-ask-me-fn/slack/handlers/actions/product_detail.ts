import {
  AllMiddlewareArgs,
  BlockExternalSelectAction,
  SlackActionMiddlewareArgs,
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import getProductDetailMessage from '../messages/product-detail.message'
import { getInstitution } from '../../../services/institution.service'
import { getProduct } from '../../../services/product.service'
import messages from '../../../utils/messages'

const productDetailAction = async ({
  body,
  ack,
  say,
}: SlackActionMiddlewareArgs<BlockExternalSelectAction> &
  AllMiddlewareArgs<StringIndexed>) => {
  await ack()

  if (!body.actions[0].selected_option?.value) {
    return
  }

  try {
    const [taxCode, subunitCode, productId] =
      body.actions[0].selected_option.value.split('_')

    const institution = await getInstitution(taxCode, subunitCode)

    const product = institution.onboarding.find(
      (product) =>
        product.productId === productId && product.status === 'ACTIVE',
    )
    if (!product) {
      throw new Error(messages.product.notFound)
    }

    const productDetails = await getProduct(
      taxCode,
      subunitCode,
      product.productId,
    )

    await say(
      getProductDetailMessage(
        institution,
        productDetails,
        product,
        taxCode,
        productId,
        subunitCode,
      ),
    )
  } catch (error) {
    if (error instanceof Error) {
      say(error.message)
    } else {
      say(messages.errors.generic)
    }
  }
}

export default productDetailAction
